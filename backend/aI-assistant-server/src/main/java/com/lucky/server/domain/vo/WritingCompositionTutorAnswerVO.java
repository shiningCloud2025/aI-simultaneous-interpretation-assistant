package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 写作作文AI辅导回答视图
 * @author shiningCloud2025
 */
@Schema(description = "写作作文AI辅导回答视图")
public record WritingCompositionTutorAnswerVO(
        @Schema(description = "作文评估记录ID") Long evaluationId,
        @Schema(description = "学生提问内容") String question,
        @Schema(description = "学生提问图片URL列表") List<String> imageUrls,
        @Schema(description = "AI辅导回答") String answer
) {
}
