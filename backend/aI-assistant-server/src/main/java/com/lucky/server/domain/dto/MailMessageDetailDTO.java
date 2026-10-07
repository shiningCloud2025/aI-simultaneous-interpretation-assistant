package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 邮件详情查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "邮件详情查询")
public record MailMessageDetailDTO(
        @NotBlank(message = "文件夹名称不能为空") @Schema(description = "文件夹完整名称") String folderName,
        @NotNull(message = "邮件UID不能为空") @Schema(description = "邮件UID") Long uid
) {
}
