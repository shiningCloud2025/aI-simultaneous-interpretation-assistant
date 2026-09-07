package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.SpeakingDifficultyEnum;
import com.lucky.server.common.enums.SpeakingLanguageEnum;
import com.lucky.server.common.enums.SpeakingSceneEnum;
import com.lucky.server.common.enums.SpeakingStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

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

        @Schema(description = "用户提示词/偏好说明")
        String userPrompt
) {
}