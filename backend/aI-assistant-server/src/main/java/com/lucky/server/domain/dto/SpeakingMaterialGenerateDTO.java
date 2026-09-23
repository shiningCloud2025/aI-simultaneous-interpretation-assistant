package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.SpeakingDifficultyEnum;
import com.lucky.server.common.enums.SpeakingLanguageEnum;
import com.lucky.server.common.enums.SpeakingSceneEnum;
import com.lucky.server.common.enums.SpeakingStageEnum;
import com.lucky.server.common.enums.SpeakingTtsVoiceEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * 口语素材生成请求参数
 * @author shiningCloud2025
 */
@Schema(name = "SpeakingMaterialGenerateDTO", description = "口语素材生成请求参数")
public record SpeakingMaterialGenerateDTO(

        @Schema(description = "语言编码")
        @NotNull(message = "语言不能为空")
        SpeakingLanguageEnum languageCode,

        @Schema(description = "学习阶段编码")
        @NotNull(message = "学习阶段不能为空")
        SpeakingStageEnum stageCode,

        @Schema(description = "难度编码")
        @NotNull(message = "难度不能为空")
        SpeakingDifficultyEnum difficultyCode,

        @Schema(description = "场景编码")
        @NotNull(message = "场景不能为空")
        SpeakingSceneEnum sceneCode,

        @Schema(description = "自定义场景")
        String customScene,

        @Schema(description = "用户提示词/偏好说明")
        String userPrompt,

        @Schema(description = "TTS音色编码（loongmary/loongeva_v3.6/loongjohn）")
        @NotNull(message = "TTS音色不能为空")
        SpeakingTtsVoiceEnum ttsVoice,

        @Schema(description = "TTS语速（0.5~2.0）")
        @NotNull(message = "TTS语速不能为空")
        @DecimalMin(value = "0.5", message = "TTS语速不能小于0.5")
        @DecimalMax(value = "2.0", message = "TTS语速不能大于2.0")
        BigDecimal ttsSpeechRate
) {
}
