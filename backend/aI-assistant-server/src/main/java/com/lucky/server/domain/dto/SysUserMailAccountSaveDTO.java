package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 用户邮箱绑定保存请求
 * @author shiningCloud2025
 */
@Schema(description = "用户邮箱绑定保存请求")
public record SysUserMailAccountSaveDTO(
        @NotBlank(message = "邮箱类型不能为空") @Size(max = 32, message = "邮箱类型长度不能超过32位") @Schema(description = "邮箱类型：QQ/NETEASE_163") String provider,
        @NotBlank(message = "邮箱账号不能为空") @Email(message = "邮箱格式不正确") @Size(max = 128, message = "邮箱账号长度不能超过128位") @Schema(description = "邮箱账号/邮箱地址") String email,
        @Size(max = 64, message = "邮箱备注名长度不能超过64位") @Schema(description = "邮箱备注名") String displayName,
        @NotBlank(message = "邮箱客户端授权码不能为空") @Size(max = 512, message = "邮箱客户端授权码长度不能超过512位") @Schema(description = "邮箱客户端授权码") String mailAuthCode,
        @Size(max = 64, message = "平台内访问密码长度不能超过64位") @Schema(description = "平台内访问密码") String accessPassword
) {}
