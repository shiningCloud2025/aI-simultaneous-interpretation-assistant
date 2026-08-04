package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 系统用户快捷键配置保存 DTO
 * @author shiningCloud2025
 */
public record SysUserShortcutConfigSaveDTO(
        @Valid @NotNull(message = "快捷键列表不能为null")
        @Schema(description = "快捷键列表")
        List<ShortcutItem> shortcuts
) {
    @Schema(name = "ShortcutItem", description = "快捷键项")
    public record ShortcutItem(
            @Schema(description = "主键ID，有值=修改，无值=新增") Long id,
            @NotBlank(message = "功能动作名不能为空") @Size(max = 64, message = "功能动作名最长64位") @Schema(description = "功能动作名") String action,
            @NotBlank(message = "快捷键键位不能为空") @Size(max = 256, message = "快捷键键位最长256位") @Schema(description = "快捷键键位组合") String keyCombination
    ) {}
}
