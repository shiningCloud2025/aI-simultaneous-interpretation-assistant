package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

/**
 * 系统用户术语条目 VO
 * @author shiningCloud2025
 */
public record SysUserTermEntryVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "原文", maxLength = 128) String sourceTerm,
        @Schema(description = "译文", maxLength = 128) String targetTerm,
        @Schema(description = "翻译方向", maxLength = 16) String direction,
        @Schema(description = "创建时间") LocalDateTime createTime,
        @Schema(description = "更新时间") LocalDateTime updateTime
) {}
