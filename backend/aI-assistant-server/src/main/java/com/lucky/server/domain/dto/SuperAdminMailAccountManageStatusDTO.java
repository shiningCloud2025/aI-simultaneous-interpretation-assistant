package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.MailAccountStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * 超管邮箱绑定管理状态更新DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管邮箱绑定管理状态更新DTO")
public record SuperAdminMailAccountManageStatusDTO(
        @NotNull(message = "邮箱状态不能为空") @Schema(description = "邮箱状态：1可用，3禁用") MailAccountStatusEnum status
) {
}
