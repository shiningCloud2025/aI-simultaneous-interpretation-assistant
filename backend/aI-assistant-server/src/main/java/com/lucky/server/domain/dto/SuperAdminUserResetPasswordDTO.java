package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 超管重置用户密码DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管重置用户密码DTO")
public record SuperAdminUserResetPasswordDTO(

        @NotBlank(message = "新密码不能为空")
        @Size(min = 6, max = 26, message = "密码长度为6-26位")
        @Schema(description = "新密码")
        String newPassword
) {
}
