package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

/**
 * 系统用户术语库 VO
 * @author shiningCloud2025
 */
public record SysUserTermLibraryVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "术语库名称", maxLength = 64) String name,
        @Schema(description = "是否默认库") Integer isDefault,
        @Schema(description = "术语条目数量") Long entryCount,
        @Schema(description = "创建时间") LocalDateTime createTime,
        @Schema(description = "更新时间") LocalDateTime updateTime
) {}
