package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.SpeakingDifficultyEnum;
import com.lucky.server.common.enums.SpeakingLanguageEnum;
import com.lucky.server.common.enums.SpeakingSceneEnum;
import com.lucky.server.common.enums.SpeakingStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 口语素材记录视图
 * @author shiningCloud2025
 */
@Schema(description = "口语素材记录视图")
public record SpeakingMaterialRecordVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "语言编码") SpeakingLanguageEnum languageCode,
        @Schema(description = "学习阶段编码") SpeakingStageEnum stageCode,
        @Schema(description = "难度编码") SpeakingDifficultyEnum difficultyCode,
        @Schema(description = "场景编码") SpeakingSceneEnum sceneCode,
        @Schema(description = "用户提示词/偏好说明") String userPrompt,
        @Schema(description = "口语素材标题") String title,
        @Schema(description = "口语练习场景说明") String sceneDescription,
        @Schema(description = "LLM厂商标识") String provider,
        @Schema(description = "LLM模型名") String modelName,
        @Schema(description = "TTS厂商标识") String ttsProvider,
        @Schema(description = "TTS模型名") String ttsModelName,
        @Schema(description = "TTS音色") String ttsVoice,
        @Schema(description = "TTS语速") BigDecimal ttsSpeechRate,
        @Schema(description = "创建时间") LocalDateTime createTime
) {
}