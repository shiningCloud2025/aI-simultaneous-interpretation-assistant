package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * 系统用户登录DTO
 * @author shiningCloud2025
 */
@Schema(description = "系统用户登录")
public record SysUserLoginDTO(
        @Size(max=128,message = "账号/手机号/邮箱长度不能超过128位") @Schema(description = "账号/手机号/邮箱" ) String keyword,
        @Size(max = 20, message = "手机号长度不能超过20位") @Schema(description = "手机号，验证码登录时使用")  String phone,
        @Email(message = "邮箱格式不正确")  @Size(max = 128, message = "邮箱长度不能超过128位")
        @Schema(description = "邮箱，验证码登录时使用")  String email,
        @Size(min = 6, max = 26, message = "密码长度为6-26位") @Schema(description = "密码")  String password,
        @Size(min = 6, max = 6, message = "验证码必须为6位")  @Schema(description = "验证码")   String captcha
) { }
