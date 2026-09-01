package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.CompositionGenreEnum;
import com.lucky.server.common.enums.CompositionLanguageEnum;
import com.lucky.server.common.enums.CompositionStageEnum;
import com.lucky.server.common.enums.CompositionSubmitTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 写作作文评估请求参数
 * @author shiningCloud2025
 */
@Schema(name = "WritingCompositionEvaluateDTO", description = "写作作文评估请求参数")
public record WritingCompositionEvaluateDTO(
        @Schema(description = "作文生成记录ID：为空表示非系统生成题目") Long generationId,
        @Schema(description = "提交类型") @NotNull(message = "提交类型不能为空") CompositionSubmitTypeEnum submitType,
        @Schema(description = "语言编码") @NotNull(message = "语言不能为空") CompositionLanguageEnum languageCode,
        @Schema(description = "学习阶段编码") @NotNull(message = "学习阶段不能为空") CompositionStageEnum stageCode,
        @Schema(description = "题型编码") @NotNull(message = "题型不能为空") CompositionGenreEnum genreCode,
        @Schema(description = "作文题目") String title,
        @Schema(description = "作文题干") @NotBlank(message = "作文题干不能为空") String prompt,
        @Schema(description = "评分标准") @NotBlank(message = "评分标准不能为空") String scoringCriteria,
        @Schema(description = "作文正文") String content,
        @Schema(description = "作文图片URL列表") List<String> imageUrls
) { }
