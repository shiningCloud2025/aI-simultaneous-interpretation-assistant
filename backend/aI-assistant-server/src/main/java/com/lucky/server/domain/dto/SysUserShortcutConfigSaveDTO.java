package com.lucky.server.domain.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * 系统用户快捷键配置保存 DTO
 * @author shiningCloud2025
 */
public record SysUserShortcutConfigSaveDTO(
        @Valid @NotNull(message = "快捷键列表不能为null") List<ShortcutItem> shortcuts
) {
    public record ShortcutItem(
            @NotBlank(message = "功能动作名不能为空") String action,
            @NotBlank(message = "快捷键键位不能为空") String keyCombination
    ) {}
}
