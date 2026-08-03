package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * 忘记密码DTO
 * @author shiningCloud2025
 */
@Schema(description = "忘记密码")
public record SysUserResetPasswordDTO(
        @Size(max = 20, message = "手机号长度不能超过20位") @Schema(description = "手机号") String phone,
        @Size(max = 128, message = "邮箱长度不能超过128位") @Schema(description = "邮箱") String email,
        @Size(min = 6, max = 6, message = "验证码必须为6位") @Schema(description = "验证码") String captcha,
        @Size(min = 6, max = 26, message = "密码长度为6-26位") @Schema(description = "新密码") String newPassword
) {}
