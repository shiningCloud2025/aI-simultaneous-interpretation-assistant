package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.CompositionGenreEnum;
import com.lucky.server.common.enums.CompositionLanguageEnum;
import com.lucky.server.common.enums.CompositionStageEnum;
import com.lucky.server.common.enums.CompositionSubmitTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * 写作作文评估记录分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "写作作文评估记录分页查询")
public record WritingCompositionEvaluationPageQueryDTO(
        @NotNull(message = "页码不能为空") @Schema(description = "页码") Integer page,
        @NotNull(message = "每页条数不能为空") @Schema(description = "每页条数") Integer size,
        @Schema(description = "筛选条件") Filter filter
) {

    @Schema(description = "写作作文评估记录筛选条件")
    public record Filter(
            @Schema(description = "是否成功：true=成功 false=失败，默认成功") Boolean success,
            @Schema(description = "提交类型") CompositionSubmitTypeEnum submitType,
            @Schema(description = "语言编码") CompositionLanguageEnum languageCode,
            @Schema(description = "学习阶段编码") CompositionStageEnum stageCode,
            @Schema(description = "题型编码") CompositionGenreEnum genreCode
    ) {}
}
