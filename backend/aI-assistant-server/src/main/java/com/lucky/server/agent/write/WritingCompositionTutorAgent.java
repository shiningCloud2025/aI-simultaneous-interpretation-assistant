package com.lucky.server.agent.write;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.agent.middleware.TimingMiddleware;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.config.AgentScopeMysqlProperties;
import com.lucky.server.config.LlmModelConfig;
import com.lucky.server.domain.dto.WritingCompositionTutorChatDTO;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.entity.WritingCompositionEvaluation;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.domain.vo.WritingCompositionTutorAnswerVO;
import com.lucky.server.mapper.WritingCompositionEvaluationMapper;
import com.lucky.server.service.SysUserApiKeyService;
import com.lucky.server.service.SysUserModelPreferenceService;
import com.lucky.server.service.SysUserService;
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
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 写作作文AI辅导 Agent
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WritingCompositionTutorAgent {
    private final SysUserModelPreferenceService sysUserModelPreferenceService;
    private final SysUserApiKeyService sysUserApiKeyService;
    private final LlmModelConfig llmModelConfig;
    private final AgentScopeMysqlProperties agentScopeMysqlProperties;
    private final DataSource dataSource;
    private final WritingCompositionEvaluationMapper writingCompositionEvaluationMapper;
    private final SysUserService sysUserService;
    private final ObjectMapper objectMapper;

    /** 用户模型级 Agent 缓存：key = userId:provider:modelName */
    private final Map<String, HarnessAgent> agentCache = new ConcurrentHashMap<>();


    /**
     * 写作作文AI辅导对话
     *
     * @param dto 对话参数
     * @return AI辅导回答
     */
    public Mono<WritingCompositionTutorAnswerVO> chat(WritingCompositionTutorChatDTO dto) {
        if (dto == null){
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "写作作文AI辅导对话请求不能为空");
        }

        validateQuestionImages(dto);
        Long userId = sysUserService.getCurrentUser().getId();
        WritingCompositionEvaluation evaluation = writingCompositionEvaluationMapper.selectById(dto.evaluationId());
        if (evaluation == null || !userId.equals(evaluation.getUserId()) || !DeletedStatusEnum.NORMAL.equals(evaluation.getDeleted())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "作文评估记录不存在");
        }

        SysUserModelPreferenceVO llmPreference = getLlmPreference(userId);
        if (hasImages(dto) || hasEvaluationImages(evaluation)) {
            validateImageModel(llmPreference);
        }

        String cacheKey = buildCacheKey(userId, llmPreference);
        HarnessAgent agent = agentCache.computeIfAbsent(cacheKey, key -> buildAgent(userId));

        RuntimeContext ctx = RuntimeContext.builder()
                .userId(String.valueOf(userId))
                .sessionId("writing_composition_tutor_" + userId + "_" + dto.evaluationId())
                .build();

        String input = buildTutorPrompt(evaluation, dto);
        UserMessage userMessage = buildUserMessage(evaluation, dto, input);

        return agent.call(List.of(userMessage), WritingCompositionTutorAnswerVO.class, ctx)
                .map(this::parseAnswer)
                .map(answer -> new WritingCompositionTutorAnswerVO(
                        dto.evaluationId(),
                        dto.question(),
                        dto.imageUrls(),
                        answer
                ))
                .doOnError(e -> log.error("写作作文AI辅导失败，evaluationId={}", dto.evaluationId(), e));



    }

    private boolean hasImages(WritingCompositionTutorChatDTO dto) {
        return dto.imageUrls() != null && !dto.imageUrls().isEmpty();
    }

    private boolean hasEvaluationImages(WritingCompositionEvaluation evaluation) {
        return !parseStringList(evaluation.getImageUrlsJson()).isEmpty();
    }



    private void validateQuestionImages(WritingCompositionTutorChatDTO dto) {
        if (!hasImages(dto)) {
            return;
        }

        boolean hasBlankUrl = dto.imageUrls().stream()
                .anyMatch(url -> url == null || url.isBlank());
        if (hasBlankUrl) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "提问图片URL不能为空");
        }
    }

    private SysUserModelPreferenceVO getLlmPreference(Long userId) {
        return sysUserModelPreferenceService.listPreferences(userId).stream()
                .filter(p -> ApiKeyTypeEnum.LLM.equals(p.modelType()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先在模型配置中选择 LLM 模型"));
    }

    private void validateImageModel(SysUserModelPreferenceVO llmPreference) {
        LlmModelConfig.ProviderInfo providerInfo = llmModelConfig.getProviders().get(llmPreference.provider());
        if (providerInfo == null || providerInfo.getModels() == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的LLM厂商: " + llmPreference.provider());
        }

        boolean supportImage = providerInfo.getModels().stream()
                .filter(model -> llmPreference.modelName().equals(model.getName()))
                .findFirst()
                .map(model -> model.getInputs() != null && model.getInputs().stream()
                        .anyMatch(input -> "IMG".equalsIgnoreCase(input)))
                .orElse(false);

        if (!supportImage) {
            throw new BusinessException(ResultCodeEnum.UNSUPPORTED_OPERATION, "当前模型不支持图片理解，请切换支持图片输入的模型");
        }
    }

    private String buildCacheKey(Long userId, SysUserModelPreferenceVO llmPreference) {
        return userId + ":" + llmPreference.provider() + ":" + llmPreference.modelName();
    }

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
                .nativeStructuredOutput(false)
                .nativeStructuredOutputWithTools(false)
                .stream(false)
                .generateOptions(
                        GenerateOptions.builder()
                                .temperature(0.4)
                                .build()
                )
                .build();

        // 5. 构建 system prompt
        String sysPrompt = """
                你是专业、耐心、善于解释的外语写作辅导老师。

                你的任务：
                1. 基于某一次已经完成的作文批阅记录，为学生答疑
                2. 帮助学生理解扣分原因、表达问题、结构问题、语法问题和修改建议
                3. 当学生质疑批阅时，要客观分析，不盲目维护原批阅
                4. 如果原批阅确实不够准确，可以温和说明更合理的理解
                5. 如果学生上传了图片，需要结合图片内容理解学生问题
                6. 回答要具体、清楚、适合学生学习
                7. 不要脱离当前作文和批阅记录泛泛教学
                8. 不要输出 Markdown
                9. 输出必须符合 WritingCompositionTutorAnswerVO 结构，只需要填写 answer 字段内容
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
                .name("writing-composition-tutor")
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
                                额外规则（作文辅导场景）：
                                - 重点记录学生反复追问的写作问题、语法弱点、表达困惑
                                - 记录学生对批阅结果的常见疑问
                                - 忽略无关闲聊内容，只保留对作文辅导有价值的信息
                                """
                        )
                        .consolidationPrompt(MemoryConsolidator.DEFAULT_CONSOLIDATION_PROMPT + """
                        额外规则（作文辅导场景）：
                        - 重点保留：学生写作弱点、常见误解、反复出现的表达问题
                        - 重点保留学生已理解或仍未理解的知识点
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

    private String buildTutorPrompt(WritingCompositionEvaluation evaluation, WritingCompositionTutorChatDTO dto) {
        return """
                请基于以下作文批阅记录，回答学生的追问。

                提交类型：
                %s

                语言：
                %s

                学习阶段：
                %s

                题型：
                %s

                作文题目：
                %s

                作文题干：
                %s

                评分标准：
                %s

                学生作文正文：
                %s

                作文图片URL列表JSON：
                %s

                图片作文OCR文本：
                %s

                评分：
                %s

                整体反馈：
                %s

                修改建议：
                %s

                作文亮点JSON：
                %s

                重点弥补项JSON：
                %s

                逐句反馈JSON：
                %s

                修改后版本：
                %s

                学生问题：
                %s
                """.formatted(
                evaluation.getSubmitType() == null ? "无" : evaluation.getSubmitType().getDesc(),
                evaluation.getLanguageCode() == null ? "无" : evaluation.getLanguageCode().getDesc(),
                evaluation.getStageCode() == null ? "无" : evaluation.getStageCode().getDesc(),
                evaluation.getGenreCode() == null ? "无" : evaluation.getGenreCode().getDesc(),
                blankToPlaceholder(evaluation.getTitle()),
                blankToPlaceholder(evaluation.getPrompt()),
                blankToPlaceholder(evaluation.getScoringCriteria()),
                blankToPlaceholder(evaluation.getContent()),
                blankToPlaceholder(evaluation.getImageUrlsJson()),
                blankToPlaceholder(evaluation.getOcrText()),
                evaluation.getScore() == null ? "无" : evaluation.getScore().toPlainString(),
                blankToPlaceholder(evaluation.getFeedback()),
                blankToPlaceholder(evaluation.getSuggestion()),
                blankToPlaceholder(evaluation.getHighlightsJson()),
                blankToPlaceholder(evaluation.getImprovementPointsJson()),
                blankToPlaceholder(evaluation.getSentenceFeedbackJson()),
                blankToPlaceholder(evaluation.getImprovedVersion()),
                dto.question()
        );
    }

    private String blankToPlaceholder(String value) {
        return value == null || value.isBlank() ? "无" : value;
    }

    private UserMessage buildUserMessage(WritingCompositionEvaluation evaluation,
                                         WritingCompositionTutorChatDTO dto,
                                         String input) {
        List<String> imageUrls = new ArrayList<>();
        imageUrls.addAll(parseStringList(evaluation.getImageUrlsJson()));
        if (dto.imageUrls() != null) {
            imageUrls.addAll(dto.imageUrls());
        }

        if (imageUrls.isEmpty()) {
            return new UserMessage(input);
        }

        List<ContentBlock> blocks = new ArrayList<>();

        blocks.add(TextBlock.builder()
                .text(input)
                .build());

        for (String imageUrl : imageUrls) {
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

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String extractJson(String text) {
        String value = text.trim();

        if (value.startsWith("```")) {
            int firstLineEnd = value.indexOf('\n');
            int lastFence = value.lastIndexOf("```");
            if (firstLineEnd >= 0 && lastFence > firstLineEnd) {
                return value.substring(firstLineEnd + 1, lastFence).trim();
            }
        }

        int start = value.indexOf('{');
        int end = value.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return value.substring(start, end + 1);
        }

        return value;
    }

    private String parseAnswer(Msg msg) {
        if (msg.hasStructuredData()) {
            WritingCompositionTutorAnswerVO result = msg.getStructuredData(WritingCompositionTutorAnswerVO.class);
            if (result != null && result.answer() != null && !result.answer().isBlank()) {
                return result.answer();
            }
        }

        String text = msg.getTextContent();
        if (text == null || text.isBlank()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "作文辅导回答为空");
        }

        try {
            WritingCompositionTutorAnswerVO result = objectMapper.readValue(extractJson(text), WritingCompositionTutorAnswerVO.class);
            if (result.answer() != null && !result.answer().isBlank()) {
                return result.answer();
            }
        } catch (Exception ignored) {
            // 非JSON文本回答直接作为 answer 返回
        }

        return text.trim();
    }
}
