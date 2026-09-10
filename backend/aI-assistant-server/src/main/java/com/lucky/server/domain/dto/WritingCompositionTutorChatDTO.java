package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 写作作文AI辅导对话请求
 * @author shiningCloud2025
 */
@Schema(description = "写作作文AI辅导对话请求")
public record WritingCompositionTutorChatDTO(
        @NotNull(message = "作文评估记录ID不能为空") @Schema(description = "作文评估记录ID") Long evaluationId,
        @NotBlank(message = "提问内容不能为空") @Schema(description = "学生提问内容") String question,
        @Size(max = 5, message = "提问图片最多上传5张") @Schema(description = "学生提问图片URL列表，最多5张") List<String> imageUrls
) {
}
