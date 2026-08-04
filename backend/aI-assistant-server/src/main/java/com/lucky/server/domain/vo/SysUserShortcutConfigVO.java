package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 系统用户快捷键配置 VO
 * @author shiningCloud2025
 */
public record SysUserShortcutConfigVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "功能动作名", maxLength = 64) String action,
        @Schema(description = "快捷键键位组合", maxLength = 256) String keyCombination
) {}
