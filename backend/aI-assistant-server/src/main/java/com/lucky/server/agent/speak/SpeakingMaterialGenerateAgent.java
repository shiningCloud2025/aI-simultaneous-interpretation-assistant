package com.lucky.server.agent.speak;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.agent.middleware.TimingMiddleware;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.SpeakingMaterialGenerationFailureStageEnum;
import com.lucky.server.common.enums.SpeakingSceneEnum;
import com.lucky.server.config.AgentScopeMysqlProperties;
import com.lucky.server.config.LlmModelConfig;
import com.lucky.server.config.SpeakingTtsProperties;
import com.lucky.server.domain.dto.SpeakingMaterialGenerateDTO;
import com.lucky.server.domain.entity.SpeakingMaterialGeneration;
import com.lucky.server.domain.entity.SpeakingMaterialGenerationFailure;
import com.lucky.server.domain.entity.SpeakingMaterialSentence;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.vo.SpeakingMaterialGenerateResultVO;
import com.lucky.server.domain.vo.SpeakingMaterialGenerateSentenceVO;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.service.*;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.message.Msg;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 口语素材生成 Agent
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SpeakingMaterialGenerateAgent {

    private final SysUserModelPreferenceService sysUserModelPreferenceService;
    private final SysUserApiKeyService sysUserApiKeyService;
    private final LlmModelConfig llmModelConfig;
    private final AgentScopeMysqlProperties agentScopeMysqlProperties;
    private final DataSource dataSource;
    private final SpeakingMaterialGenerationService speakingMaterialGenerationService;
    private final SpeakingMaterialSentenceService speakingMaterialSentenceService;
    private final SpeakingMaterialGenerationFailureService speakingMaterialGenerationFailureService;
    private final ObjectMapper objectMapper;
    private final SysUserService sysUserService;
    private final SpeakingTtsProperties speakingTtsProperties;
    private final SpeakingTtsGenerateService speakingTtsGenerateService;

    /** 用户模型级 Agent 缓存：key = userId:provider:modelName */
    private final Map<String, HarnessAgent> agentCache = new ConcurrentHashMap<>();


    /**
     * 生成口语素材
     *
     * @param dto 生成参数
     * @return 口语素材生成结果
     */
    public Mono<SpeakingMaterialGenerateResultVO> generate(SpeakingMaterialGenerateDTO dto){
        Long userId = sysUserService.getCurrentUser().getId();
        SysUserModelPreferenceVO llmPreference = getLlmPreference(userId);
        if (!dto.stageCode().belongsToLanguage(dto.languageCode().getCode())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "学习阶段与语言不匹配");
        }

        String cacheKey = buildCacheKey(userId, llmPreference);
        HarnessAgent agent = agentCache.computeIfAbsent(cacheKey, key -> buildAgent(userId));

        RuntimeContext ctx = RuntimeContext.builder()
                .userId(String.valueOf(userId))
                .sessionId("speaking_material_generate_" + userId)
                .build();

        String input = buildUserPrompt(dto);
        AtomicBoolean failureSaved = new AtomicBoolean(false);

        return agent.call(List.of(new UserMessage(input)), SpeakingMaterialAgentResult.class, ctx)
                .map(this::parseResult)
                .map(result -> {
                    validateResult(result);
                    return result;
                })
                .map(result -> {
                    try {
                        return saveGenerationWithSentences(dto, userId, llmPreference, result);
                    } catch (BusinessException e) {
                        failureSaved.set(true);
                        throw e;
                    } catch (Exception e) {
                        failureSaved.set(true);
                        saveFailureSafely(dto, userId, llmPreference, SpeakingMaterialGenerationFailureStageEnum.PERSIST, e, safeRawResponse(result));
                        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语素材保存失败");
                    }
                })
                .doOnError(e -> {
                    if (!failureSaved.get()) {
                        saveFailureSafely(dto, userId, llmPreference, SpeakingMaterialGenerationFailureStageEnum.MATERIAL_GENERATE, e, null);
                    }
                    log.error("口语素材生成失败", e);
                });
    }

    private HarnessAgent buildAgent(Long userId) {
        List<SysUserModelPreferenceVO> preferences = sysUserModelPreferenceService.listPreferences(userId);
        SysUserModelPreferenceVO llmPreference = preferences.stream()
                .filter(p -> ApiKeyTypeEnum.LLM.equals(p.modelType()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先在模型配置中选择 LLM 模型"));
        String modelName = llmPreference.modelName();
        String provider = llmPreference.provider();

        SysUserApiKey apiKeyEntity = sysUserApiKeyService.getAvailableLlmKey(userId, provider);
        if (apiKeyEntity == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先配置 " + provider + " 的可用 LLM API Key");
        }

        LlmModelConfig.ProviderInfo providerInfo = llmModelConfig.getProviders().get(provider);
        if (providerInfo == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的LLM厂商: " + provider);
        }

        OpenAIChatModel model = OpenAIChatModel.builder()
                .apiKey(apiKeyEntity.getApiKey())
                .modelName(modelName)
                .baseUrl(providerInfo.getEndpoint())
                .nativeStructuredOutput(false)
                .nativeStructuredOutputWithTools(false)
                .stream(false)
                .generateOptions(GenerateOptions.builder().temperature(0.7).build())
                .build();

        String sysPrompt = """
                你是专业的外语口语跟读素材老师。

                你的任务：
                1. 根据用户给定的语言、学习阶段、难度、场景和偏好，生成适合跟读训练的口语素材
                2. 素材必须符合对应学习阶段的词汇、语法和表达能力要求
                3. 每次生成 3 到 5 个句子，句子之间应围绕同一个真实口语场景展开
                4. 句子应适合学生跟读，不要过长，不要堆砌复杂从句
                5. translation 返回句子的中文译文
                6. keyPoints 返回该句值得学习的重点词、短语或表达
                7. practiceTips 返回该句跟读时需要注意的发音、语调、连读或停顿建议
                8. 不要输出 Markdown，不要输出解释文本
                9. 输出必须符合 SpeakingMaterialAgentResult 结构

                字段要求：
                - title：口语素材标题
                - sceneDescription：口语练习场景说明
                - sentences：口语跟读句子列表
                - sortOrder：句子排序，从 1 开始
                - sentence：跟读句子
                - translation：句子译文
                - keyPoints：重点词/重点表达，至少 1 条
                - practiceTips：跟读建议，至少 1 条
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
                .name("speaking-material-generate")
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
                        .build())
                .memory(MemoryConfig.builder()
                        .flushTrigger(MemoryConfig.FlushTrigger.throttled(Duration.ofMinutes(10)))
                        .flushPrompt(MemoryFlushManager.DEFAULT_FLUSH_PROMPT + """
                                额外规则（口语素材生成场景）：
                                - 重点记录用户常用学习阶段、难度、场景和口语表达偏好
                                - 记录最近生成过的口语场景主题，避免重复
                                - 忽略无关闲聊内容，只保留对口语训练有价值的信息
                                """)
                        .consolidationPrompt(MemoryConsolidator.DEFAULT_CONSOLIDATION_PROMPT + """
                                额外规则（口语素材生成场景）：
                                - 重点保留：用户口语训练偏好、常练场景、难度偏好、表达偏好
                                - 重点保留最近生成过的口语素材主题，避免重复
                                - 可丢弃无关闲聊、临时性对话内容、重复信息
                                """)
                        .consolidationMinGap(Duration.ofMinutes(30))
                        .dailyFileRetentionDays(30)
                        .sessionRetentionDays(45)
                        .consolidationMaxTokens(12_000)
                        .build())
                .skillRepository(skillRepository)
                .build();
    }

    private String buildUserPrompt(SpeakingMaterialGenerateDTO dto) {
        String scene = SpeakingSceneEnum.CUSTOM.equals(dto.sceneCode()) ? "自定义" : dto.sceneCode().getDesc();
        String userPrompt = dto.userPrompt() == null || dto.userPrompt().isBlank() ? "无" : dto.userPrompt().trim();

        return """
                请生成一份口语跟读训练素材。

                语言：%s
                学习阶段：%s
                难度：%s
                场景：%s
                用户偏好：%s
                """.formatted(
                dto.languageCode().getDesc(),
                dto.stageCode().getDesc(),
                dto.difficultyCode().getDesc(),
                scene,
                userPrompt
        );
    }


    private SysUserModelPreferenceVO getLlmPreference(Long userId) {
        List<SysUserModelPreferenceVO> preferences = sysUserModelPreferenceService.listPreferences(userId);
        return preferences.stream()
                .filter(p -> ApiKeyTypeEnum.LLM.equals(p.modelType()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先在模型配置中选择 LLM 模型"));
    }


    private SpeakingMaterialAgentResult parseResult(Msg msg) {
        if (msg.hasStructuredData()) {
            SpeakingMaterialAgentResult result = msg.getStructuredData(SpeakingMaterialAgentResult.class);
            if (result != null) {
                return result;
            }
        }

        String text = msg.getTextContent();
        if (text == null || text.isBlank()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语素材生成结果为空");
        }

        try {
            return objectMapper.readValue(extractJson(text), SpeakingMaterialAgentResult.class);
        } catch (Exception e) {
            log.error("解析口语素材生成文本结果失败，text={}", text, e);
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语素材生成结果解析失败");
        }
    }

    private String toJson(Object value) throws JsonProcessingException {
        return value == null ? null : objectMapper.writeValueAsString(value);
    }


    private String extractJson(String text) {
        String value = text.trim();

        if (value.startsWith("```json")) {
            value = value.substring("```json".length()).trim();
        } else if (value.startsWith("```")) {
            value = value.substring("```".length()).trim();
        }

        if (value.endsWith("```")) {
            value = value.substring(0, value.length() - 3).trim();
        }

        int start = value.indexOf('{');
        int end = value.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return value.substring(start, end + 1);
        }

        return value;
    }

    private String buildCacheKey(Long userId, SysUserModelPreferenceVO llmPreference) {
        return userId + ":" + llmPreference.provider() + ":" + llmPreference.modelName();
    }

    private void validateResult(SpeakingMaterialAgentResult result) {
        if (result == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语素材生成结果为空");
        }
        if (result.title() == null || result.title().isBlank()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语素材标题为空");
        }
        if (result.sentences() == null || result.sentences().isEmpty()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语跟读句子为空");
        }
        for (SpeakingMaterialAgentSentenceResult sentence : result.sentences()) {
            if (sentence.sentence() == null || sentence.sentence().isBlank()) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语跟读句子内容为空");
            }
        }
    }

    private SpeakingMaterialGenerateResultVO saveGenerationWithSentences(SpeakingMaterialGenerateDTO dto,
                                                                         Long userId,
                                                                         SysUserModelPreferenceVO llmPreference,
                                                                         SpeakingMaterialAgentResult result) {
        SpeakingMaterialGeneration generation = new SpeakingMaterialGeneration();
        generation.setLanguageCode(dto.languageCode());
        generation.setStageCode(dto.stageCode());
        generation.setDifficultyCode(dto.difficultyCode());
        generation.setSceneCode(dto.sceneCode());
        generation.setUserPrompt(dto.userPrompt());
        generation.setTitle(result.title());
        generation.setSceneDescription(result.sceneDescription());
        generation.setProvider(llmPreference.provider());
        generation.setModelName(llmPreference.modelName());
        generation.setTtsProvider(speakingTtsProperties.getProvider());
        generation.setTtsModelName(speakingTtsProperties.getModelName());
        generation.setTtsVoice(speakingTtsProperties.getDefaultVoice().getCode());
        generation.setTtsSpeechRate(speakingTtsProperties.getSpeechRate());

        Long materialId = speakingMaterialGenerationService.saveGeneration(generation);
        List<SpeakingMaterialGenerateSentenceVO> sentenceVOList = new ArrayList<>();

        for (SpeakingMaterialAgentSentenceResult item : result.sentences()) {
            try {
                String ttsText = item.sentence();
                String audioUrl = speakingTtsGenerateService.generateAndUpload(ttsText);

                SpeakingMaterialSentence sentence = new SpeakingMaterialSentence();
                sentence.setMaterialId(materialId);
                sentence.setSortOrder(item.sortOrder());
                sentence.setSentence(item.sentence());
                sentence.setTranslation(item.translation());
                sentence.setTtsText(ttsText);
                sentence.setStandardAudioUrl(audioUrl);
                sentence.setKeyPoints(toJson(item.keyPoints()));
                sentence.setPracticeTips(toJson(item.practiceTips()));

                Long sentenceId = speakingMaterialSentenceService.saveSentence(sentence);
                sentenceVOList.add(new SpeakingMaterialGenerateSentenceVO(
                        sentenceId,
                        item.sortOrder(),
                        item.sentence(),
                        item.translation(),
                        audioUrl,
                        item.keyPoints(),
                        item.practiceTips()
                ));
            } catch (Exception e) {
                saveFailureSafely(dto, userId, llmPreference, SpeakingMaterialGenerationFailureStageEnum.TTS_GENERATE, e, safeRawResponse(result));
                throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "口语标准音频生成失败");
            }
        }

        return new SpeakingMaterialGenerateResultVO(
                materialId,
                result.title(),
                result.sceneDescription(),
                sentenceVOList
        );
    }

    private void saveFailureSafely(SpeakingMaterialGenerateDTO dto,
                                   Long userId,
                                   SysUserModelPreferenceVO llmPreference,
                                   SpeakingMaterialGenerationFailureStageEnum failureStage,
                                   Throwable error,
                                   String rawResponse) {
        try {
            SpeakingMaterialGenerationFailure entity = new SpeakingMaterialGenerationFailure();
            entity.setLanguageCode(dto == null ? null : dto.languageCode());
            entity.setStageCode(dto == null ? null : dto.stageCode());
            entity.setDifficultyCode(dto == null ? null : dto.difficultyCode());
            entity.setSceneCode(dto == null ? null : dto.sceneCode());
            entity.setUserPrompt(dto == null ? null : dto.userPrompt());
            entity.setProvider(llmPreference == null ? null : llmPreference.provider());
            entity.setModelName(llmPreference == null ? null : llmPreference.modelName());
            entity.setTtsProvider(speakingTtsProperties.getProvider());
            entity.setTtsModelName(speakingTtsProperties.getModelName());
            entity.setTtsVoice(speakingTtsProperties.getDefaultVoice().getCode());
            entity.setTtsSpeechRate(speakingTtsProperties.getSpeechRate());
            entity.setFailureStage(failureStage);
            entity.setErrorMessage(error.getMessage());
            entity.setRawResponse(rawResponse);
            entity.setCreatedById(userId);

            speakingMaterialGenerationFailureService.saveFailure(entity);
        } catch (Exception e) {
            log.error("保存口语素材生成失败记录异常", e);
        }
    }


    private String safeRawResponse(SpeakingMaterialAgentResult result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            return null;
        }
    }

}
