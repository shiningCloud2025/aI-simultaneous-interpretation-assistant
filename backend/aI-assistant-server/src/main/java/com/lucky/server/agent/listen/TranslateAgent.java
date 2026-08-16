package com.lucky.server.agent.listen;

import com.lucky.server.agent.middleware.TimingMiddleware;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.config.LlmModelConfig;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.domain.vo.SysUserTermEntryVO;
import com.lucky.server.domain.vo.SysUserTermLibraryVO;
import com.lucky.server.service.*;
import io.agentscope.core.model.GenerateOptions;
import io.agentscope.core.permission.PermissionContextState;
import io.agentscope.core.permission.PermissionMode;
import io.agentscope.core.state.AgentStateStore;
import io.agentscope.core.tool.Toolkit;
import io.agentscope.core.tool.builtin.TodoTools;
import io.agentscope.core.tracing.OtelTracingMiddleware;
import io.agentscope.extensions.model.openai.OpenAIChatModel;
import io.agentscope.extensions.mysql.state.MysqlAgentStateStore;
import io.agentscope.harness.agent.HarnessAgent;
import io.agentscope.harness.agent.memory.MemoryConfig;
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


    private final SysUserService sysUserService;
    private final SysUserApiKeyService sysUserApiKeyService;
    private final SysUserModelPreferenceService sysUserModelPreferenceService;
    private final SysUserTermLibraryService sysUserTermLibraryService;
    private final SysUserTermEntryService sysUserTermEntryService;
    private final DataSource dataSource;



    private final LlmModelConfig llmModelConfig;
    /** HarnessAgent 缓存（key = userId:sessionId） */
    private final Map<String, HarnessAgent> agentCache = new ConcurrentHashMap<>();
    /**
     * 实时翻译
     * @param sessionId  会话ID（同一用户多次翻译用不同sessionId区分）
     * @param sourceText ASR识别的最新原文
     * @param onToken    译文token回调（每个token推送给前端，实现打字机效果）
     */
    public void translate(String sessionId, String sourceText, String direction, Consumer<String> onToken){

        String agentKey = sysUserService.getCurrentUser().getId() + ":" + sessionId;
        HarnessAgent agent = agentCache.computeIfAbsent(agentKey, k -> buildAgent(direction));

    }

    /**
     * 构建 HarnessAgent
     * 根据当前用户配置（API Key、模型偏好、术语库）创建翻译 Agent
     */
    private HarnessAgent buildAgent(String direction){
        Long userId = sysUserService.getCurrentUser().getId();

        // 1. 查模型偏好
        List<SysUserModelPreferenceVO> preferences = sysUserModelPreferenceService.listPreferences();
        SysUserModelPreferenceVO llmPreference = preferences.stream()
                .filter(p -> "LLM".equals(p.modelType()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先在模型配置中选择 LLM 模型"));
        String modelName = llmPreference.modelName();
        String provider = llmPreference.provider();  // 从偏好里拿厂商

        // 2. 查 API Key
        SysUserApiKey apiKeyEntity = sysUserApiKeyService.getAvailableLlmKey(provider);
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
        List<SysUserTermLibraryVO> libraries = sysUserTermLibraryService.listByUserId();
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
        AgentStateStore stateStore = new MysqlAgentStateStore(dataSource,true);

        // 7. 构建 HarnessAgent
        return HarnessAgent.builder()
                .name("translator-" + userId)
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


                )
                .build();
    }
}
