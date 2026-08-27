package com.lucky.server.agent.read;

import com.lucky.server.agent.middleware.TimingMiddleware;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.common.enums.ReadingWordMaterialFailureStageEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.config.AgentScopeMysqlProperties;
import com.lucky.server.config.LlmModelConfig;
import com.lucky.server.config.ReadingWordImageProperties;
import com.lucky.server.domain.dto.ReadingWordMaterialGenerateDTO;
import com.lucky.server.domain.entity.ReadingWordMaterial;
import com.lucky.server.domain.entity.ReadingWordMaterialFailure;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.vo.ReadingWordMaterialGenerateResultVO;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.service.*;
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
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 阅读单词素材生成 Agent
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReadingWordMaterialGenerateAgent {

    private final SysUserService sysUserService;
    private final SysUserApiKeyService sysUserApiKeyService;
    private final SysUserModelPreferenceService sysUserModelPreferenceService;
    private final LlmModelConfig llmModelConfig;
    private final AgentScopeMysqlProperties agentScopeMysqlProperties;
    private final DataSource dataSource;
    private final ReadingWordMaterialService readingWordMaterialService;
    private final ReadingWordMaterialFailureService readingWordMaterialFailureService;
    private final ReadingWordImageGenerateService readingWordImageGenerateService;
    private final ReadingWordImageProperties readingWordImageProperties;


    /** 用户模型级 Agent 缓存：key = userId:provider:modelName */
    private final Map<String, HarnessAgent> agentCache = new ConcurrentHashMap<>();

    /**
     * 生成阅读单词素材
     *
     * @param dto 生成参数
     * @return 阅读单词素材生成结果
     */
    public Mono<ReadingWordMaterialGenerateResultVO> generate(ReadingWordMaterialGenerateDTO dto) {
        Long userId = sysUserService.getCurrentUser().getId();
        SysUserModelPreferenceVO llmPreference = getLlmPreference(userId);
        if (!dto.stageCode().belongsToLanguage(dto.languageCode().getCode())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "学习阶段与语言不匹配");
        }

        String cacheKey = buildCacheKey(userId, llmPreference);
        HarnessAgent agent = agentCache.computeIfAbsent(cacheKey, key -> buildAgent(userId));

        RuntimeContext ctx = RuntimeContext.builder()
                .userId(String.valueOf(userId))
                .sessionId("reading_word_material_generate_" + userId)
                .build();

        String input = """
                请生成一份阅读单词学习素材。

                单词/词语：%s
                语言：%s
                学习阶段：%s
                """.formatted(
                dto.word().trim(),
                dto.languageCode().getDesc(),
                dto.stageCode().getDesc()
        );

        AtomicBoolean failureSaved = new AtomicBoolean(false);
        return agent.call(List.of(new UserMessage(input)), ReadingWordMaterialGenerateResultVO.class, ctx)
                .map(msg -> {
                    ReadingWordMaterialGenerateResultVO result =
                            msg.getStructuredData(ReadingWordMaterialGenerateResultVO.class);

                    if (result == null) {
                        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "阅读单词素材生成结果为空");
                    }

                    if (result.imagePrompt() == null || result.imagePrompt().isBlank()) {
                        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "图片生成提示词为空");
                    }


                    return result;
                })
                // 2. 根据 imagePrompt 生成图片，并把 COS URL 回填到 result
                .map(result -> {
                    try {
                        String imageUrl = readingWordImageGenerateService.generateAndUpload(result.imagePrompt());

                        return new ReadingWordMaterialGenerateResultVO(
                                result.sentence(),
                                result.translation(),
                                result.imagePrompt(),
                                imageUrl
                        );
                    } catch (Exception e) {
                        failureSaved.set(true);
                        saveFailureSafely(
                                dto,
                                userId,
                                llmPreference,
                                ReadingWordMaterialFailureStageEnum.IMAGE_GENERATE,
                                e,
                                safeRawResponse(result)
                        );
                        throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "单词配图生成失败");
                    }
                })

                // 3. 保存最终完整结果：sentence + translation + imagePrompt + imageUrl
                .map(result -> {
                    try {
                        saveMaterial(dto, userId, llmPreference, result);
                        return result;
                    } catch (Exception e) {
                        failureSaved.set(true);
                        saveFailureSafely(
                                dto,
                                userId,
                                llmPreference,
                                ReadingWordMaterialFailureStageEnum.PERSIST,
                                e,
                                safeRawResponse(result)
                        );
                        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "阅读单词素材保存失败");
                    }
                })
                .doOnError(e -> {
                    if (!failureSaved.get()) {
                        saveFailureSafely(dto, userId, llmPreference, ReadingWordMaterialFailureStageEnum.SENTENCE_GENERATE, e, null);
                    }
                    log.error("阅读单词素材生成失败", e);
                });
    }

    /**
     * 构建 HarnessAgent
     * 根据当前用户配置（API Key、模型偏好）创建阅读单词素材生成 Agent
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
                                .temperature(0.6)
                                .build()
                )
                .build();

        // 5. 构建 system prompt
        String sysPrompt = """
                你是专业的外语阅读词汇老师。

                你的任务：
                1. 根据用户给定的单词/词语、语言和学习阶段，生成一份适合学生理解的阅读学习素材
                2. 例句必须自然、准确，并严格符合对应学习阶段的词汇和语法难度
                3. 例句应突出目标单词/词语的常见含义和常见用法
                4. 例句不要过长，不要使用明显超出学习阶段的复杂表达
                5. translation 返回例句的中文译文
                6. imagePrompt 返回适合生成单词配图的中文图片提示词，必须具体、清晰、适合学生理解
                7. imageUrl 固定返回 null，由系统后续生成图片并回填
                8. 不要输出 Markdown，不要输出解释文本
                9. 输出必须符合 ReadingWordMaterialGenerateResultVO 结构
                
                字段要求：
                - sentence：例句
                - translation：例句译文
                - imagePrompt：图片生成提示词
                - imageUrl：固定返回 null
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
                .name("reading-word-material-generate")
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
                                额外规则（阅读单词素材生成场景）：
                                - 重点记录用户常练语言、学习阶段和词汇难度偏好
                                - 记录用户容易混淆或反复学习的单词
                                - 忽略无关闲聊内容，只保留对阅读词汇学习有价值的信息
                                """
                        )
                        .consolidationPrompt(MemoryConsolidator.DEFAULT_CONSOLIDATION_PROMPT + """
                        额外规则（阅读单词素材生成场景）：
                        - 重点保留：用户阅读学习阶段、常练语言、词汇难度偏好、薄弱词汇类型
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

    private SysUserModelPreferenceVO getLlmPreference(Long userId) {
        List<SysUserModelPreferenceVO> preferences = sysUserModelPreferenceService.listPreferences(userId);
        return preferences.stream()
                .filter(p -> ApiKeyTypeEnum.LLM.equals(p.modelType()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先在模型配置中选择 LLM 模型"));
    }

    private void saveMaterial(ReadingWordMaterialGenerateDTO dto,
                              Long userId,
                              SysUserModelPreferenceVO llmPreference,
                              ReadingWordMaterialGenerateResultVO result) {
        ReadingWordMaterial entity = new ReadingWordMaterial();
        entity.setWord(dto.word().trim());
        entity.setLanguageCode(dto.languageCode());
        entity.setStageCode(dto.stageCode());
        entity.setSentence(result.sentence());
        entity.setTranslation(result.translation());
        entity.setImagePrompt(blankToNull(result.imagePrompt()));
        entity.setImageUrl(blankToNull(result.imageUrl()));
        entity.setProvider(llmPreference.provider());
        entity.setModelName(llmPreference.modelName());
        entity.setImageProvider(readingWordImageProperties.getProvider());
        entity.setImageModelName(readingWordImageProperties.getModel());
        entity.setCreatedById(userId);

        readingWordMaterialService.saveMaterial(entity);
    }

    private void saveFailureSafely(ReadingWordMaterialGenerateDTO dto,
                                   Long userId,
                                   SysUserModelPreferenceVO llmPreference,
                                   ReadingWordMaterialFailureStageEnum failureStage,
                                   Throwable error,
                                   String rawResponse) {
        try {
            ReadingWordMaterialFailure entity = new ReadingWordMaterialFailure();
            entity.setWord(dto == null || dto.word() == null || dto.word().isBlank() ? "未知" : dto.word().trim());
            entity.setLanguageCode(dto == null ? null : dto.languageCode());
            entity.setStageCode(dto == null ? null : dto.stageCode());
            entity.setProvider(llmPreference == null ? null : llmPreference.provider());
            entity.setModelName(llmPreference == null ? null : llmPreference.modelName());
            entity.setImageProvider(readingWordImageProperties.getProvider());
            entity.setImageModelName(readingWordImageProperties.getModel());
            entity.setFailureStage(failureStage);
            entity.setErrorCode(error.getClass().getSimpleName());
            entity.setErrorMessage(error.getMessage());
            entity.setRawResponse(rawResponse);
            entity.setCreatedById(userId);

            readingWordMaterialFailureService.saveFailure(entity);
        } catch (Exception e) {
            log.error("保存阅读单词素材失败记录异常", e);
        }
    }

    private String safeRawResponse(ReadingWordMaterialGenerateResultVO result) {
        try {
            return result == null
                    ? null
                    : "sentence=" + result.sentence()
                    + ", translation=" + result.translation()
                    + ", imagePrompt=" + result.imagePrompt()
                    + ", imageUrl=" + result.imageUrl();
        } catch (Exception e) {
            return null;
        }
    }

    private String buildCacheKey(Long userId, SysUserModelPreferenceVO llmPreference) {
        return userId + ":" + llmPreference.provider() + ":" + llmPreference.modelName();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
