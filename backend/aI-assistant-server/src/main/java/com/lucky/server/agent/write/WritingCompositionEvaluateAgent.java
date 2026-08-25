package com.lucky.server.agent.write;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.agent.middleware.TimingMiddleware;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.common.enums.CompositionSubmitTypeEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.config.AgentScopeMysqlProperties;
import com.lucky.server.config.LlmModelConfig;
import com.lucky.server.domain.dto.WritingCompositionEvaluateDTO;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.entity.WritingCompositionEvaluation;
import com.lucky.server.domain.entity.WritingCompositionEvaluationFailure;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.domain.vo.WritingCompositionEvaluateResultVO;
import com.lucky.server.service.*;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.message.*;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 写作作文评估 Agent
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WritingCompositionEvaluateAgent {

    private final SysUserService sysUserService;
    private final SysUserApiKeyService sysUserApiKeyService;
    private final SysUserModelPreferenceService sysUserModelPreferenceService;
    private final LlmModelConfig llmModelConfig;
    private final AgentScopeMysqlProperties agentScopeMysqlProperties;
    private final DataSource dataSource;
    private final WritingCompositionEvaluationService writingCompositionEvaluationService;
    private final WritingCompositionEvaluationFailureService writingCompositionEvaluationFailureService;
    private final ObjectMapper objectMapper;

    /** 用户模型级 Agent 缓存：key = userId:provider:modelName */
    private final Map<String, HarnessAgent> agentCache = new ConcurrentHashMap<>();

    /**
     * 评估作文
     *
     * @param dto 评估参数
     * @return 作文评估结果
     */
    public Mono<WritingCompositionEvaluateResultVO> evaluate(WritingCompositionEvaluateDTO dto) {
        validateSubmitContent(dto);

        Long userId = sysUserService.getCurrentUser().getId();
        SysUserModelPreferenceVO llmPreference = getLlmPreference(userId);
        String cacheKey = buildCacheKey(userId, llmPreference);
        HarnessAgent agent = agentCache.computeIfAbsent(cacheKey, key -> buildAgent(userId));

        RuntimeContext ctx = RuntimeContext.builder()
                .userId(String.valueOf(userId))
                .sessionId("writing_composition_evaluate_" + userId)
                .build();

        String input;
        if (CompositionSubmitTypeEnum.TEXT.equals(dto.submitType())) {
            input = """
                    请评估以下文本作文。

                    语言：%s
                    学习阶段：%s
                    题型：%s

                    作文题目：
                    %s

                    作文题干：
                    %s

                    评分标准：
                    %s

                    作文正文：
                    %s
                    """.formatted(
                    dto.languageCode().getDesc(),
                    dto.stageCode().getDesc(),
                    dto.genreCode().getDesc(),
                    blankToPlaceholder(dto.title()),
                    dto.prompt(),
                    dto.scoringCriteria(),
                    dto.content()
            );
        } else {
            input = """
        请评估以下图片作文。

        语言：%s
        学习阶段：%s
        题型：%s

        作文题干：
        %s

        评分标准：
        %s

        请先从图片中识别学生作文正文；如果图片中包含作文题目，也一并理解。
        然后根据作文题干和评分标准进行评估。
        """.formatted(
                    dto.languageCode().getDesc(),
                    dto.stageCode().getDesc(),
                    dto.genreCode().getDesc(),
                    dto.prompt(),
                    dto.scoringCriteria()
            );
        }
        AtomicBoolean failureSaved = new AtomicBoolean(false);
        UserMessage userMessage = buildUserMessage(dto, input);
        return agent.call(List.of(userMessage), WritingCompositionEvaluateResultVO.class, ctx)
                .map(msg -> {
                    WritingCompositionEvaluateResultVO result =
                            msg.getStructuredData(WritingCompositionEvaluateResultVO.class);

                    if (result == null) {
                        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "作文评估结果为空");
                    }

                    return result;
                })
                .map(result -> {
                    try {
                        saveEvaluation(dto, userId, llmPreference, result);
                        return result;
                    } catch (Exception e) {
                        failureSaved.set(true);
                        saveFailureSafely(dto, userId, llmPreference, "persist", e, safeRawResponse(result));
                        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "作文评估记录保存失败");
                    }
                })
                .doOnError(e -> {
                    if (!failureSaved.get()) {
                        saveFailureSafely(dto, userId, llmPreference, "model_evaluate", e, null);
                    }
                    log.error("作文评估失败", e);
                });
    }

    /**
     * 构建 HarnessAgent
     * 根据当前用户配置（API Key、模型偏好）创建作文评估 Agent
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
                // 降低时间消耗，把结构化输出能力从厂商移到框架
                .nativeStructuredOutput(false)
                .nativeStructuredOutputWithTools(false)
                .stream(false)
                .generateOptions(
                        GenerateOptions.builder()
                                .temperature(0.3)
                                .build()
                )
                .build();

        // 5. 构建 system prompt
        String sysPrompt = """
                你是专业的外语作文评估老师。

                你的任务：
                1. 根据作文题干、评分标准和学生作文内容进行评估
                2. 如果输入是图片作文，需要先识别图片中的学生作文正文；如果图片中包含作文题目，也一并理解
                3. 评分使用百分制，score 范围为 0-100
                4. 评价要具体、清晰、适合学生理解
                5. 必须指出作文亮点和重点弥补项
                6. 必须提供逐句反馈，逐句反馈要覆盖学生作文中的主要句子
                7. 必须给出修改后版本
                8. 不要输出 Markdown，不要输出解释文本
                9. 输出必须符合 WritingCompositionEvaluateResultVO 结构

                字段要求：
                - score：评分，百分制
                - feedback：整体反馈
                - suggestion：整体修改建议
                - highlights：作文亮点列表
                - improvementPoints：重点弥补项列表
                - sentenceFeedback：逐句反馈列表
                - improvedVersion：修改后版本

                sentenceFeedback 每一项字段要求：
                - index：句子序号，从 1 开始
                - original：原句
                - feedback：该句评价
                - suggestion：该句修改建议
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
                .name("writing-composition-evaluate")
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
                                额外规则（作文评估场景）：
                                - 重点记录用户常见写作问题、常见语法错误和表达弱点
                                - 记录用户反复出现的亮点表达和薄弱点
                                - 忽略无关闲聊内容，只保留对作文评估和训练有价值的信息
                                """
                        )
                        .consolidationPrompt(MemoryConsolidator.DEFAULT_CONSOLIDATION_PROMPT + """
                        额外规则（作文评估场景）：
                        - 重点保留：用户常见写作错误、薄弱语法点、词汇问题、结构问题
                        - 重点保留用户已经掌握的亮点能力
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


    /**
     * 校验作文提交内容
     *
     * @param dto 评估参数
     */
    private void validateSubmitContent(WritingCompositionEvaluateDTO dto) {
        if (CompositionSubmitTypeEnum.TEXT.equals(dto.submitType())) {
            if (dto.content() == null || dto.content().isBlank()) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "文本作文内容不能为空");
            }
            return;
        }

        if (CompositionSubmitTypeEnum.IMAGE.equals(dto.submitType())) {
            if (dto.imageUrls() == null || dto.imageUrls().isEmpty()) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "图片作文不能为空");
            }

            boolean hasBlankUrl = dto.imageUrls().stream()
                    .anyMatch(url -> url == null || url.isBlank());
            if (hasBlankUrl) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "图片作文URL不能为空");
            }
        }
    }

    private String blankToPlaceholder(String value) {
        return value == null || value.isBlank() ? "无" : value;
    }

    private SysUserModelPreferenceVO getLlmPreference(Long userId) {
        List<SysUserModelPreferenceVO> preferences = sysUserModelPreferenceService.listPreferences(userId);
        return preferences.stream()
                .filter(p -> ApiKeyTypeEnum.LLM.equals(p.modelType()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先在模型配置中选择 LLM 模型"));
    }

    private void saveEvaluation(WritingCompositionEvaluateDTO dto,
                                Long userId,
                                SysUserModelPreferenceVO llmPreference,
                                WritingCompositionEvaluateResultVO result) throws JsonProcessingException {
        WritingCompositionEvaluation entity = new WritingCompositionEvaluation();
        entity.setUserId(userId);
        entity.setGenerationId(dto.generationId());
        entity.setSubmitType(dto.submitType());
        entity.setLanguageCode(dto.languageCode());
        entity.setStageCode(dto.stageCode());
        entity.setGenreCode(dto.genreCode());
        entity.setTitle(dto.title());
        entity.setPrompt(dto.prompt());
        entity.setScoringCriteria(dto.scoringCriteria());
        entity.setContent(dto.content());
        entity.setImageUrlsJson(toJson(dto.imageUrls()));
        entity.setScore(result.score());
        entity.setFeedback(result.feedback());
        entity.setSuggestion(result.suggestion());
        entity.setHighlightsJson(toJson(result.highlights()));
        entity.setImprovementPointsJson(toJson(result.improvementPoints()));
        entity.setSentenceFeedbackJson(toJson(result.sentenceFeedback()));
        entity.setImprovedVersion(result.improvedVersion());
        entity.setProvider(llmPreference.provider());
        entity.setModelName(llmPreference.modelName());
        entity.setCreatedById(userId);

        writingCompositionEvaluationService.saveEvaluation(entity);
    }

    private void saveFailureSafely(WritingCompositionEvaluateDTO dto,
                                   Long userId,
                                   SysUserModelPreferenceVO llmPreference,
                                   String failureStage,
                                   Throwable error,
                                   String rawResponse) {
        try {
            WritingCompositionEvaluationFailure entity = new WritingCompositionEvaluationFailure();
            entity.setUserId(userId);
            entity.setGenerationId(dto == null ? null : dto.generationId());
            entity.setSubmitType(dto == null ? null : dto.submitType());
            entity.setLanguageCode(dto == null ? null : dto.languageCode());
            entity.setStageCode(dto == null ? null : dto.stageCode());
            entity.setGenreCode(dto == null ? null : dto.genreCode());
            entity.setTitle(dto == null ? null : dto.title());
            entity.setPrompt(dto == null ? null : dto.prompt());
            entity.setScoringCriteria(dto == null ? null : dto.scoringCriteria());
            entity.setContent(dto == null ? null : dto.content());
            entity.setImageUrlsJson(dto == null ? null : safeToJson(dto.imageUrls()));
            entity.setProvider(llmPreference == null ? null : llmPreference.provider());
            entity.setModelName(llmPreference == null ? null : llmPreference.modelName());
            entity.setFailureStage(failureStage);
            entity.setErrorCode(error.getClass().getSimpleName());
            entity.setErrorMessage(error.getMessage());
            entity.setRawResponse(rawResponse);
            entity.setCreatedById(userId);

            writingCompositionEvaluationFailureService.saveFailure(entity);
        } catch (Exception e) {
            log.error("保存作文评估失败记录异常", e);
        }
    }

    private String toJson(Object value) throws JsonProcessingException {
        return value == null ? null : objectMapper.writeValueAsString(value);
    }

    private String safeToJson(Object value) {
        try {
            return value == null ? null : objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return null;
        }
    }

    private String safeRawResponse(WritingCompositionEvaluateResultVO result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 构建用户消息
     * 文本提交使用纯文本消息；图片提交使用文本 + 图片的多模态消息
     *
     * @param dto 评估参数
     * @param input 文本提示词
     * @return 用户消息
     */
    private UserMessage buildUserMessage(WritingCompositionEvaluateDTO dto, String input) {
        if (CompositionSubmitTypeEnum.TEXT.equals(dto.submitType())) {
            return new UserMessage(input);
        }

        List<ContentBlock> blocks = new ArrayList<>();

        blocks.add(TextBlock.builder()
                .text(input)
                .build());

        for (String imageUrl : dto.imageUrls()) {
            blocks.add(ImageBlock.builder()
                    .source(URLSource.builder()
                            .url(imageUrl)
                            .build())
                    .build());
        }

        return UserMessage.builder()
                .content(blocks)
                .build();
    }

    private String buildCacheKey(Long userId, SysUserModelPreferenceVO llmPreference) {
        return userId + ":" + llmPreference.provider() + ":" + llmPreference.modelName();
    }
}
