package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 用户端 Skill 列表项VO
 * @author shiningCloud2025
 */
@Schema(description = "用户端 Skill 列表项VO")
public record SysUserSkillVO(
        @Schema(description = "Skill ID") Long id,
        @Schema(description = "Skill名称") String name,
        @Schema(description = "Skill描述") String description,
        @Schema(description = "Skill来源标识") String source,
        @Schema(description = "Skill来源展示文案") String sourceText,
        @Schema(description = "创建时间") LocalDateTime createdAt,
        @Schema(description = "更新时间") LocalDateTime updatedAt
) {
}
