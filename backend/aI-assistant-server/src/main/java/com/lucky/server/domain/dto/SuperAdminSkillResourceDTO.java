package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 超管 AgentScope Skill 资源DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管 AgentScope Skill 资源DTO")
public record SuperAdminSkillResourceDTO(
        @Schema(description = "资源路径或文件名") @NotBlank(message = "资源名称不能为空") @Size(max = 500, message = "资源名称长度不能超过500位") String path,
        @Schema(description = "资源内容") @NotBlank(message = "资源内容不能为空") String content
) {
}
