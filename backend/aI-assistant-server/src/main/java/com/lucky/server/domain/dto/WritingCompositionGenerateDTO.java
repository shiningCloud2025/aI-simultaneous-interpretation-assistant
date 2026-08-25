package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.CompositionDifficultyEnum;
import com.lucky.server.common.enums.CompositionGenreEnum;
import com.lucky.server.common.enums.CompositionLanguageEnum;
import com.lucky.server.common.enums.CompositionSceneEnum;
import com.lucky.server.common.enums.CompositionStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * 写作作文生成请求参数
 * @author shiningCloud2025
 */
@Schema(name = "WritingCompositionGenerateDTO", description = "写作作文生成请求参数")
public record WritingCompositionGenerateDTO(

        @Schema(description = "语言编码")
        @NotNull(message = "语言不能为空")
        CompositionLanguageEnum languageCode,

        @Schema(description = "学习阶段编码")
        @NotNull(message = "学习阶段不能为空")
        CompositionStageEnum stageCode,

        @Schema(description = "题型编码")
        @NotNull(message = "题型不能为空")
        CompositionGenreEnum genreCode,

        @Schema(description = "难度编码")
        @NotNull(message = "难度不能为空")
        CompositionDifficultyEnum difficultyCode,

        @Schema(description = "场景编码")
        @NotNull(message = "场景不能为空")
        CompositionSceneEnum sceneCode,

        @Schema(description = "自定义场景")
        String customScene
) {
}
