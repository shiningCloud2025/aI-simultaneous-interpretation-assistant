package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 系统用户术语条目保存 DTO
 * @author shiningCloud2025
 */
public record SysUserTermEntrySaveDTO(
        @NotNull(message = "术语库ID不能为null") @Schema(description = "术语库ID") Long libraryId,
        @Valid @NotNull(message = "条目列表不能为null") @Schema(description = "条目列表") List<EntryItem> entries
) {
    @Schema(name = "EntryItem", description = "术语条目项")
    public record EntryItem(
            @Schema(description = "主键ID，有值=修改，无值=新增") Long id,
            @NotBlank(message = "原文不能为空") @Size(max = 128, message = "原文最长128位") @Schema(description = "原文") String sourceTerm,
            @NotBlank(message = "译文不能为空") @Size(max = 128, message = "译文最长128位") @Schema(description = "译文") String targetTerm,
            @NotBlank(message = "翻译方向不能为空") @Size(max = 16, message = "翻译方向最长16位") @Schema(description = "翻译方向") String direction
    ) {}
}
