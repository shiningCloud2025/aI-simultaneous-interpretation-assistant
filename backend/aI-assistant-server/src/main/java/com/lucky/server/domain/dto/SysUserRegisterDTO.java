package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 系统用户注册DTO
 * @author shiningCloud2025
 */
@Schema(description = "系统用户注册")
public record SysUserRegisterDTO(
        @NotBlank(message = "账号不能为空") @Size(min = 5, max = 12, message = "账号长度为5-12位") @Schema(description = "账号") String account,
        @NotBlank(message = "用户名不能为空") @Size(min = 1, max = 32, message = "用户名长度不能超过32位") @Schema(description = "用户名/昵称") String username,
        @NotBlank(message = "密码不能为空") @Size(min = 6, max = 26, message = "密码长度为6-26位") @Schema(description = "密码") String password,
        @Size(max = 20, message = "手机号长度不能超过20位") @Schema(description = "手机号，选填") String phone,
        @Email(message = "邮箱格式不正确") @Size(max = 128, message = "邮箱长度不能超过128位") @Schema(description = "邮箱，选填") String email,
        @Size(min = 6, max = 6, message = "短信验证码必须为6位") @Schema(description = "短信验证码，填手机时必填") String smsCaptcha,
        @Size(min = 6, max = 6, message = "邮箱验证码必须为6位") @Schema(description = "邮箱验证码，填邮箱时必填") String emailCaptcha,
        @Size(max = 2056, message = "头像URL长度不能超过2056位") @Schema(description = "头像URL，选填") String avatar
) {}
