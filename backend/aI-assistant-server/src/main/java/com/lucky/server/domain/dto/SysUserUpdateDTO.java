package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * 系统用户修改资料DTO
 * @author shiningCloud2025
 */
@Schema(description = "系统用户修改资料")
public record SysUserUpdateDTO(
        @Size(min = 1, max = 32, message = "用户名长度不能超过32位") @Schema(description = "用户名/昵称") String username,
        @Size(min = 6, max = 26, message = "密码长度为6-26位") @Schema(description = "新密码") String password,
        @Size(max = 20, message = "手机号长度不能超过20位") @Schema(description = "手机号") String phone,
        @Email(message = "邮箱格式不正确") @Size(max = 128, message = "邮箱长度不能超过128位") @Schema(description = "邮箱") String email,
        @Size(max = 2056, message = "头像URL长度不能超过2056位") @Schema(description = "头像URL") String avatar,
        @Size(min = 6, max = 6, message = "短信验证码必须为6位") @Schema(description = "短信验证码，改手机时必填") String smsCaptcha,
        @Size(min = 6, max = 6, message = "邮箱验证码必须为6位") @Schema(description = "邮箱验证码，改邮箱时必填") String emailCaptcha
) {}
