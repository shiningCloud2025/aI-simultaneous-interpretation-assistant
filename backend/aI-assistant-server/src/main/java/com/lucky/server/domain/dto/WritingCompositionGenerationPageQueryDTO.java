package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.CompositionDifficultyEnum;
import com.lucky.server.common.enums.CompositionGenreEnum;
import com.lucky.server.common.enums.CompositionLanguageEnum;
import com.lucky.server.common.enums.CompositionSceneEnum;
import com.lucky.server.common.enums.CompositionStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * 写作作文生成记录分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "写作作文生成记录分页查询")
public record WritingCompositionGenerationPageQueryDTO(
        @NotNull(message = "页码不能为空") @Schema(description = "页码") Integer page,
        @NotNull(message = "每页条数不能为空") @Schema(description = "每页条数") Integer size,
        @Schema(description = "筛选条件") Filter filter
) {

    @Schema(description = "写作作文生成记录筛选条件")
    public record Filter(
            @Schema(description = "是否成功：true=成功 false=失败，默认成功") Boolean success,
            @Schema(description = "语言编码") CompositionLanguageEnum languageCode,
            @Schema(description = "学习阶段编码") CompositionStageEnum stageCode,
            @Schema(description = "题型编码") CompositionGenreEnum genreCode,
            @Schema(description = "难度编码") CompositionDifficultyEnum difficultyCode,
            @Schema(description = "场景编码") CompositionSceneEnum sceneCode
    ) {}
}
