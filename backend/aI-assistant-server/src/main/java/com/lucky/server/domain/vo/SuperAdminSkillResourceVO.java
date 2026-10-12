package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 超管 AgentScope Skill 资源VO
 * @author shiningCloud2025
 */
@Schema(description = "超管 AgentScope Skill 资源VO")
public record SuperAdminSkillResourceVO(
        @Schema(description = "资源路径或文件名") String path,
        @Schema(description = "资源内容") String content
) {
}
