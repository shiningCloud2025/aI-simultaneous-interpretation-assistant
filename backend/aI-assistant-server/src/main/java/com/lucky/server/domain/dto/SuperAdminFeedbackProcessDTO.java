package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * 超管处理反馈DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管处理反馈DTO")
public record SuperAdminFeedbackProcessDTO(
        @Schema(description = "回复内容，解决反馈时可填写") @Size(max = 2000, message = "回复内容长度不能超过2000位") String replyContent
) {
}
