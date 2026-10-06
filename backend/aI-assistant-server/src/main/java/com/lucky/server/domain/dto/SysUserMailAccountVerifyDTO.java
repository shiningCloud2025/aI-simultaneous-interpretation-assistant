package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

/**
 * 用户邮箱访问密码校验请求
 * @author shiningCloud2025
 */
@Schema(description = "用户邮箱访问密码校验请求")
public record SysUserMailAccountVerifyDTO(
        @Size(max = 64, message = "平台内访问密码长度不能超过64位") @Schema(description = "平台内访问密码") String accessPassword
) {}
