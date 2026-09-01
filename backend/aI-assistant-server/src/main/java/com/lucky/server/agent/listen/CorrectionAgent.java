package com.lucky.server.agent.listen;

import com.lucky.server.agent.middleware.TimingMiddleware;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.config.AgentScopeMysqlProperties;
import com.lucky.server.config.LlmModelConfig;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.domain.vo.SysUserTermEntryVO;
import com.lucky.server.domain.vo.SysUserTermLibraryVO;
import com.lucky.server.service.SysUserApiKeyService;
import com.lucky.server.service.SysUserModelPreferenceService;
import com.lucky.server.service.SysUserTermEntryService;
import com.lucky.server.service.SysUserTermLibraryService;
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

import javax.sql.DataSource;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * 纠错 Agent：对实时翻译的原文和译文进行后置纠错
 *
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CorrectionAgent {

    private final SysUserModelPreferenceService sysUserModelPreferenceService;
    private final SysUserApiKeyService sysUserApiKeyService;
    private final SysUserTermLibraryService sysUserTermLibraryService;
    private final SysUserTermEntryService sysUserTermEntryService;
    private final LlmModelConfig llmModelConfig;
    private final DataSource dataSource;
    private final AgentScopeMysqlProperties agentScopeMysqlProperties;

    /** 会话模型级 Agent 缓存：key = userId:sessionId:direction:provider:modelName */
    private final Map<String, HarnessAgent> agentCache = new ConcurrentHashMap<>();


    /**
     * 纠错
     *
     * @param userId     用户ID
     * @param sessionId  会话ID（内部会加 "correction_" 前缀，与翻译记忆隔离）
     * @param sourceText 待纠错的原文
     * @param targetText 待纠错的译文
     * @param direction  翻译方向，如 zh-en
     * @param onResult   成功回调：完整纠错结果
     * @param onError    失败回调：错误提示
     * @param onComplete 结束回调（成功或失败都会触发）
     */
    public void correct(Long userId, String sessionId, String sourceText, String targetText,
                        String direction, Consumer<CorrectionResult> onResult,
                        Consumer<String> onError, Runnable onComplete) {

        SysUserModelPreferenceVO llmPreference;
        String cacheKey;
        // 从缓存取 Agent，没有就原子地 build 并缓存
        HarnessAgent agent;
        try {
            llmPreference = getLlmPreference(userId);
            cacheKey = buildCacheKey(userId, sessionId, direction, llmPreference);
            agent = agentCache.computeIfAbsent(cacheKey, key -> buildAgent(userId, direction));
        } catch (BusinessException e) {
            log.error("构建纠错 Agent 失败: {}", e.getMessage());
            onError.accept(e.getMessage());
            onComplete.run();
            return;
        } catch (Exception e) {
            log.error("构建纠错Agent出现系统异常: {}", e.getMessage());
            onError.accept("系统异常");
            onComplete.run();
            return;
        }

        // 会话前缀隔离：纠错与翻译的记忆/状态分开
        RuntimeContext ctx = RuntimeContext.builder()
                .userId(String.valueOf(userId))
                .sessionId("correction_" + sessionId)
                .build();

        // 拼装纠错输入：原文 + 译文
        String input = buildCorrectionPrompt(sourceText, targetText);

        agent.call(List.of(new UserMessage(input)), CorrectionResult.class)
                .doOnNext(msg -> {
                    CorrectionResult r = msg.getStructuredData(CorrectionResult.class);
                    if (r != null) {
                        onResult.accept(r);
                    }
                })
                .doOnError(e -> {
                    log.error("纠错失败", e);
                    onError.accept("纠错失败");
                })
                .doFinally(sig -> {
                    onComplete.run();
                })
                .subscribe();
    }

    /**
     * 构建纠错 HarnessAgent（与翻译 Agent 共用同一 LLM 模型）
     *
     * @param userId    用户ID
     * @param direction 翻译方向
     */
    private HarnessAgent buildAgent(Long userId,String direction){
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

        // 4. 查术语库（纠错也需要术语对照，保证纠错时术语一致）
        String termGlossary = "";
        List<SysUserTermLibraryVO> libraries = sysUserTermLibraryService.listByUserId(userId);
        SysUserTermLibraryVO defaultLib = libraries.stream()
                .filter(lib -> lib.isDefault() == 1)
                .findFirst().orElse(null);
        if (defaultLib != null) {
            List<SysUserTermEntryVO> entries = sysUserTermEntryService.listByLibraryId(defaultLib.id());
            if (!entries.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                for (SysUserTermEntryVO entry : entries) {
                    if (direction.equals(entry.direction())) {
                        sb.append("  - ").append(entry.sourceTerm())
                                .append(" → ").append(entry.targetTerm()).append("\n");
                    }
                }
                termGlossary = sb.toString();
            }
        }

        // 5. 构建模型
        OpenAIChatModel model = OpenAIChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .baseUrl(baseUrl)
                .stream(true)
                .generateOptions(
                        GenerateOptions.builder()
                                .temperature(0.3)
                                .build()
                )
                .build();

        // 6. 构建纠错 system prompt
        String sysPrompt = """
                你是一个实时转译纠错助手，翻译方向：%s。

                你会收到一组"原文 + 译文"，两者都可能存在错误：
                - 原文来自实时语音识别，可能存在同音字、漏字、多字、断句错误
                - 译文来自机器翻译，可能存在错译、漏译、语序不通顺

                你的任务：
                1. 纠正原文中的识别错误，但不改变原意
                2. 纠正译文中的翻译错误，使其准确、通顺、自然
                3. 原文和译文逐句对应，不合并、不拆分、不增删内容
                4. 没有错误的部分原样保留，不要为了"纠错"而改写

                输出格式（严格按此输出，不要任何解释）：
                {"source": "纠错后的原文", "target": "纠错后的译文"}
                """.formatted(direction);


        if (!termGlossary.isEmpty()) {
            sysPrompt += "\n术语对照表（纠错时术语必须一致）：\n" + termGlossary;
        }

        Toolkit toolkit = new Toolkit();
        toolkit.registerTool(new TodoTools());

        // 自动放行工作目录内的文件操作
        PermissionContextState permCtx = PermissionContextState.builder()
                .mode(PermissionMode.BYPASS)
                .build();

        // 构建 MySQL 状态存储（自动建库建表）
        AgentStateStore stateStore = new MysqlAgentStateStore(
                dataSource,
                agentScopeMysqlProperties.getDatabase(),
                agentScopeMysqlProperties.getSessionTable(),
                agentScopeMysqlProperties.isCreateIfNotExist()
        );

        // 构建 MySQL Skill仓库(自动建库建表)
        MysqlSkillRepository skillRepository = MysqlSkillRepository.builder(dataSource)
                .databaseName(agentScopeMysqlProperties.getDatabase())
                .skillsTableName(agentScopeMysqlProperties.getSkillTable())
                .resourcesTableName(agentScopeMysqlProperties.getSkillResourceTable())
                .createIfNotExist(agentScopeMysqlProperties.isCreateIfNotExist())
                .writeable(agentScopeMysqlProperties.isSkillWriteable())
                .build();

        // 7. 构建 HarnessAgent
        return HarnessAgent.builder()
                .name("correction")
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
                                额外规则（纠错场景）：
                                - 重点记录用户的纠错偏好和常见识别错误
                                - 记录用户反复出现的同音字错误、术语误译
                                - 忽略无关的闲聊内容，只保留对纠错有价值的事实
                                """
                        )
                        .consolidationPrompt(MemoryConsolidator.DEFAULT_CONSOLIDATION_PROMPT + """
                        额外规则（纠错场景）：
                        - 重点保留：用户的纠错偏好、常见识别错误、术语对照
                        - 可丢弃：无关闲聊、临时性对话内容、重复信息
                        - 相同错误只保留一条
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

    /**
     * 拼装纠错输入 prompt（规则和输出格式已在 sysPrompt 中定义，这里只给数据）
     *
     * @param sourceText 原文
     * @param targetText 译文
     * @return 纠错输入文本
     */
    private String buildCorrectionPrompt(String sourceText, String targetText) {
        return """
            请纠错以下内容：

            原文：%s
            译文：%s
            """.formatted(sourceText, targetText);
    }

    /**
     * 销毁指定会话的纠错 Agent（WebSocket 断开时调用）
     *
     * @param userId    用户ID
     * @param sessionId 会话ID
     */
    public void destroy(Long userId, String sessionId) {
        String prefix = userId + ":" + sessionId + ":";
        agentCache.entrySet().removeIf(entry -> {
            if (entry.getKey().startsWith(prefix)) {
                entry.getValue().close();
                return true;
            }
            return false;
        });
    }

    private SysUserModelPreferenceVO getLlmPreference(Long userId) {
        List<SysUserModelPreferenceVO> preferences = sysUserModelPreferenceService.listPreferences(userId);
        return preferences.stream()
                .filter(p -> ApiKeyTypeEnum.LLM.equals(p.modelType()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先在模型配置中选择 LLM 模型"));
    }

    private String buildCacheKey(Long userId, String sessionId, String direction, SysUserModelPreferenceVO llmPreference) {
        return userId + ":" + sessionId + ":" + direction + ":" + llmPreference.provider() + ":" + llmPreference.modelName();
    }


    /**
     * 纠错结果：source 纠错后原文，target 纠错后译文
     */
    public record CorrectionResult(String source, String target) {}

}
