package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 系统用户登录Token响应
 * @author shiningCloud2025
 */
@Schema(description = "系统用户登录Token响应")
public record SysUserLoginTokenVO(
        @Schema(description = "JWT Token") String token
) { }
