package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 系统用户术语库保存 DTO
 * @author shiningCloud2025
 */
public record SysUserTermLibrarySaveDTO(
        @NotBlank(message = "术语库名称不能为空") @Size(max = 64, message = "术语库名称最长64位") @Schema(description = "术语库名称") String name,
        @NotNull(message = "是否默认库不能为null") @Schema(description = "是否默认库") Integer isDefault
) {}
