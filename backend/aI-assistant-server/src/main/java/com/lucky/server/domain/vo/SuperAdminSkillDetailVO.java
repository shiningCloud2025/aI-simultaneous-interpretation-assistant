package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 超管 AgentScope Skill 详情VO
 * @author shiningCloud2025
 */
@Schema(description = "超管 AgentScope Skill 详情VO")
public record SuperAdminSkillDetailVO(
        @Schema(description = "Skill ID") Long id,
        @Schema(description = "Skill名称") String name,
        @Schema(description = "Skill描述") String description,
        @Schema(description = "Skill内容") String skillContent,
        @Schema(description = "Skill来源") String source,
        @Schema(description = "Skill元数据JSON") String metadataJson,
        @Schema(description = "创建时间") LocalDateTime createdAt,
        @Schema(description = "更新时间") LocalDateTime updatedAt
) {
}
