package com.lucky.server.agent.writing;

import com.lucky.server.agent.middleware.TimingMiddleware;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.common.enums.CompositionSceneEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.config.AgentScopeMysqlProperties;
import com.lucky.server.config.LlmModelConfig;
import com.lucky.server.domain.dto.WritingCompositionGenerateDTO;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.domain.vo.WritingCompositionGenerateResultVO;
import com.lucky.server.service.SysUserApiKeyService;
import com.lucky.server.service.SysUserModelPreferenceService;
import com.lucky.server.service.SysUserService;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.message.UserMessage;
import io.agentscope.core.model.GenerateOptions;
import io.agentscope.core.permission.PermissionContextState;
import io.agentscope.core.permission.PermissionMode;
import io.agentscope.core.skill.repository.mysql.MysqlSkillRepository;
import io.agentscope.core.state.AgentStateStore;
import io.agentscope.core.tool.Toolkit;
import io.agentscope.core.tool.builtin.TodoTools;
import io.agentscope.core.tracing.OtelTracingMiddleware;
import io.agentscope.extensions.model.openai.OpenAIChatModel;
import io.agentscope.extensions.mysql.state.MysqlAgentStateStore;
import io.agentscope.harness.agent.HarnessAgent;
import io.agentscope.harness.agent.memory.MemoryConfig;
import io.agentscope.harness.agent.memory.MemoryConsolidator;
import io.agentscope.harness.agent.memory.MemoryFlushManager;
import io.agentscope.harness.agent.memory.compaction.CompactionConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import javax.sql.DataSource;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 写作作文题目生成 Agent
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WritingCompositionGenerateAgent {

    private final SysUserService sysUserService;
    private final SysUserApiKeyService sysUserApiKeyService;
    private final SysUserModelPreferenceService sysUserModelPreferenceService;
    private final LlmModelConfig llmModelConfig;
    private final AgentScopeMysqlProperties agentScopeMysqlProperties;
    private final DataSource dataSource;


    /** 用户级 Agent 缓存：key = userId */
    private final Map<Long, HarnessAgent> agentCache = new ConcurrentHashMap<>();

    /**
     * 生成作文题目
     *
     * @param dto 生成参数
     * @return 作文生成结果
     */
    public Mono<WritingCompositionGenerateResultVO> generate(WritingCompositionGenerateDTO dto) {
        Long userId = sysUserService.getCurrentUser().getId();
        HarnessAgent agent = agentCache.computeIfAbsent(userId,this::buildAgent);


        RuntimeContext ctx = RuntimeContext.builder()
                .userId(String.valueOf(userId))
                .sessionId("writing_composition_generate_" + userId)
                .build();

        String scene = CompositionSceneEnum.CUSTOM.equals(dto.sceneCode())
                ?dto.customScene()
                :dto.sceneCode().getDesc();


        String input = """
                请生成一份作文训练题。

                语言：%s
                学习阶段：%s
                题型：%s
                难度：%s
                场景：%s
                """.formatted(
                dto.languageCode().getDesc(),
                dto.stageCode().getDesc(),
                dto.genreCode().getDesc(),
                dto.difficultyCode().getDesc(),
                scene
        );

        return agent.call(List.of(new UserMessage(input)), WritingCompositionGenerateResultVO.class, ctx)
                .map(msg -> {
                    WritingCompositionGenerateResultVO result =
                            msg.getStructuredData(WritingCompositionGenerateResultVO.class);

                    if (result == null) {
                        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "作文题目生成结果为空");
                    }

                    return result;
                })
                .doOnError(e -> log.error("作文题目生成失败", e));

    }


    /**
     * 构建 HarnessAgent
     * 根据当前用户配置（API Key、模型偏好）创建作文生成 Agent
     *
     * @param userId 用户ID
     * @return HarnessAgent
     */
    private HarnessAgent buildAgent(Long userId) {
        // 1. 查模型偏好
        List<SysUserModelPreferenceVO> preferences = sysUserModelPreferenceService.listPreferences(userId);
        SysUserModelPreferenceVO llmPreference = preferences.stream()
                .filter(p -> ApiKeyTypeEnum.LLM.equals(p.modelType()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先在模型配置中选择 LLM 模型"));
        String modelName = llmPreference.modelName();
        String provider = llmPreference.provider();

        // 2. 查 API Key
        SysUserApiKey apiKeyEntity = sysUserApiKeyService.getAvailableLlmKey(userId, provider);
        if (apiKeyEntity == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先配置 " + provider + " 的可用 LLM API Key");
        }
        String apiKey = apiKeyEntity.getApiKey();

        // 3. 查 baseUrl
        LlmModelConfig.ProviderInfo providerInfo = llmModelConfig.getProviders().get(provider);
        if (providerInfo == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的LLM厂商: " + provider);
        }
        String baseUrl = providerInfo.getEndpoint();

        // 4. 构建模型
        OpenAIChatModel model = OpenAIChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .baseUrl(baseUrl)
                .stream(false)
                .generateOptions(
                        GenerateOptions.builder()
                                .temperature(0.7)
                                .build()
                )
                .build();

        // 5. 构建 system prompt
        String sysPrompt = """
                你是专业的外语作文出题老师。

                你的任务：
                1. 根据用户给定的语言、学习阶段、题型、难度和场景生成作文题目
                2. 题目必须符合对应学习阶段的真实写作能力要求
                3. 只生成写作任务，不要写范文，不要批改，不要评分
                4. 输出必须符合 WritingCompositionGenerateResultVO 结构
                5. 所有数组字段至少返回 2 条内容

                字段要求：
                - title：作文标题
                - prompt：作文题干
                - requirement：写作要求
                - wordLimitMin：最低字数
                - wordLimitMax：最高字数
                - keyPoints：写作要点
                - vocabularyHints：词汇提示
                - structureHints：结构提示
                - scoringCriteria：评分标准
                """;


        Toolkit toolkit = new Toolkit();
        toolkit.registerTool(new TodoTools());

        PermissionContextState permCtx = PermissionContextState.builder()
                .mode(PermissionMode.BYPASS)
                .build();

        AgentStateStore stateStore = new MysqlAgentStateStore(
                dataSource,
                agentScopeMysqlProperties.getDatabase(),
                agentScopeMysqlProperties.getSessionTable(),
                agentScopeMysqlProperties.isCreateIfNotExist()
        );

        MysqlSkillRepository skillRepository = MysqlSkillRepository.builder(dataSource)
                .databaseName(agentScopeMysqlProperties.getDatabase())
                .skillsTableName(agentScopeMysqlProperties.getSkillTable())
                .resourcesTableName(agentScopeMysqlProperties.getSkillResourceTable())
                .createIfNotExist(agentScopeMysqlProperties.isCreateIfNotExist())
                .writeable(agentScopeMysqlProperties.isSkillWriteable())
                .build();

        return HarnessAgent.builder()
                .name("writing-composition-generate")
                .sysPrompt(sysPrompt)
                .model(model)
                .middlewares(List.of(new OtelTracingMiddleware(), new TimingMiddleware()))
                .enableTaskList(true)
                .toolkit(toolkit)
                .permissionContext(permCtx)
                .stateStore(stateStore)
                .compaction(CompactionConfig.builder()
                        .triggerMessages(30)
                        .keepMessages(10)
                        .build()
                )
                .memory(MemoryConfig.builder()
                        .flushTrigger(MemoryConfig.FlushTrigger.throttled(Duration.ofMinutes(10)))
                        .flushPrompt(
                                MemoryFlushManager.DEFAULT_FLUSH_PROMPT + """
                                额外规则（作文生成场景）：
                                - 重点记录用户常用学习阶段、题型、难度和场景偏好
                                - 记录最近生成过的作文题主题，避免重复出题
                                - 忽略无关闲聊内容，只保留对作文训练有价值的信息
                                """
                        )
                        .consolidationPrompt(MemoryConsolidator.DEFAULT_CONSOLIDATION_PROMPT + """
                        额外规则（作文生成场景）：
                        - 重点保留：用户写作训练偏好、常练题型、常练场景、难度偏好
                        - 重点保留最近出过的题目主题，避免重复
                        - 可丢弃无关闲聊、临时性对话内容、重复信息
                        """)
                        .consolidationMinGap(Duration.ofMinutes(30))
                        .dailyFileRetentionDays(30)
                        .sessionRetentionDays(45)
                        .consolidationMaxTokens(12_000)
                        .build()
                )
                .skillRepository(skillRepository)
                .build();

    }




}
