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
import com.lucky.server.service.*;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.event.AgentEventType;
import io.agentscope.core.event.TextBlockDeltaEvent;
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
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TranslateAgent {


    private final SysUserApiKeyService sysUserApiKeyService;
    private final SysUserModelPreferenceService sysUserModelPreferenceService;
    private final SysUserTermLibraryService sysUserTermLibraryService;
    private final SysUserTermEntryService sysUserTermEntryService;
    private final DataSource dataSource;
    private final LlmModelConfig llmModelConfig;
    private final AgentScopeMysqlProperties agentScopeMysqlProperties;

    /** 会话模型级 Agent 缓存：key = userId:sessionId:direction:provider:modelName */
    private final Map<String, HarnessAgent> agentCache = new ConcurrentHashMap<>();


    /**
     * 实时翻译
     *
     * @param userId     用户ID
     * @param sessionId  会话ID（同一用户多次翻译用不同sessionId区分）
     * @param sourceText ASR识别的最新原文（增量）
     * @param direction  翻译方向，如 zh-en
     * @param onToken    译文token回调（每个token推送给前端，实现打字机效果）
     * @param onComplete 翻译结束回调（成功或失败都会触发，用于串行续翻）
     */
    public void translate(Long userId,String sessionId, String sourceText,
                          String direction, Consumer<String> onToken,Runnable onComplete){

        SysUserModelPreferenceVO llmPreference;
        String cacheKey;
        HarnessAgent agent;
        try {
            llmPreference = getLlmPreference(userId);
            cacheKey = buildCacheKey(userId, sessionId, direction, llmPreference);
            // 并发安全保障
            agent = agentCache.computeIfAbsent(cacheKey, key -> buildAgent(userId, direction));
            } catch (BusinessException e) {
                log.error("构建翻译 Agent 失败: {}", e.getMessage());
                onToken.accept("[翻译失败: " + e.getMessage() + "]");
                onComplete.run();
                return;
            } catch (Exception e) {
                log.error("构建翻译Agent出现系统异常: {}", e.getMessage());
                onToken.accept("[系统异常: " + e.getMessage() + "]");
                onComplete.run();
                return;
            }

        RuntimeContext ctx = RuntimeContext.builder()
                .userId(String.valueOf(userId))
                .sessionId(sessionId)
                .build();

        agent.streamEvents(sourceText,ctx)
                .doOnNext(event -> {
                    if (event.getType()== AgentEventType.TEXT_BLOCK_DELTA){
                        onToken.accept(((TextBlockDeltaEvent) event).getDelta());
                    }
                })
                .doOnError(e -> {
                    log.error("翻译失败", e);
                    onToken.accept("[翻译失败]");
                })
                .doFinally(sig -> {
                    onComplete.run();
                })

                .subscribe();


    }

    /**
     * 构建 HarnessAgent
     * 根据当前用户配置（API Key、模型偏好、术语库）创建翻译 Agent
     */
    private HarnessAgent buildAgent(Long userId, String direction) {

        // 1. 查模型偏好
        List<SysUserModelPreferenceVO> preferences = sysUserModelPreferenceService.listPreferences(userId);
        SysUserModelPreferenceVO llmPreference = preferences.stream()
                .filter(p ->  ApiKeyTypeEnum.LLM.equals(p.modelType()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先在模型配置中选择 LLM 模型"));
        String modelName = llmPreference.modelName();
        String provider = llmPreference.provider();  // 从偏好里拿厂商

        // 2. 查 API Key
        SysUserApiKey apiKeyEntity = sysUserApiKeyService.getAvailableLlmKey(userId,provider);
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
        // 4. 查术语库
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
        // 6. 构建 system prompt
        String sysPrompt = """
            你是实时翻译助手，翻译方向：%s。
            
            要求：
            1. 直接输出译文，不要任何解释或额外内容
            2. 只翻译本次新增内容，已翻译部分不重复
            3. 输入不完整时只翻译已确定的词，不猜测后续
            4. 保持原文语序，逐句对应
         """.formatted(direction);

        if (!termGlossary.isEmpty()) {
            sysPrompt += "\n术语对照表（必须使用）：\n" + termGlossary;
        }

        Toolkit toolkit = new Toolkit();
        toolkit.registerTool(new TodoTools());

        // 自动放行工作目录内的文件操作,主要是因为目前是在规定任务内所以目前几乎无危险,可以带给用户更好体验
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
                .name("translator")
                .sysPrompt(sysPrompt)
                .model(model)
                .middlewares(List.of(new OtelTracingMiddleware(), new TimingMiddleware()))
                .enableTaskList(true)
                .toolkit(toolkit)
                .permissionContext(permCtx)
                .stateStore(stateStore)
                .compaction(CompactionConfig.builder()
                        // 触发消息数
                        .triggerMessages(30)
                        // 保留消息数
                        .keepMessages(10)
                        .build()
                )
                .memory(MemoryConfig.builder()
                        .flushTrigger(MemoryConfig.FlushTrigger.throttled(Duration.ofMinutes(10)))
                        .flushPrompt(
                                MemoryFlushManager.DEFAULT_FLUSH_PROMPT + """
                                额外规则（翻译场景）：
                                - 重点记录用户的翻译偏好和常用术语习惯
                                - 记录用户反复使用的专业领域词汇
                                - 忽略无关的闲聊内容，只保留对翻译有价值的事实
                                """
                        )
                        .consolidationPrompt(MemoryConsolidator.DEFAULT_CONSOLIDATION_PROMPT + """
                        额外规则（翻译场景）：
                        - 重点保留：用户的翻译偏好、常用术语对照、专业领域词汇
                        - 可丢弃：无关闲聊、临时性对话内容、重复信息
                        - 术语按领域分类，相同术语只保留一条
                        """)
                        // 后台合并间隔30分钟
                        .consolidationMinGap(Duration.ofMinutes(30))
                        // 日流水账 30 天后归档
                        .dailyFileRetentionDays(30)
                        // 会话日志 45 天后清理
                        .sessionRetentionDays(45)
                        // MEMORY.md 上限 12000
                        .consolidationMaxTokens(12_000)
                        .build()
                )
                .skillRepository(skillRepository)
                .build();
    }


    /**
     * 销毁指定会话的翻译 Agent（WebSocket 断开时调用）
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
}
