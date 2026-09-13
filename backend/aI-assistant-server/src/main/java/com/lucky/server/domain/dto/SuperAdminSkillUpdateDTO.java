package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 超管修改 AgentScope Skill DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管修改 AgentScope Skill DTO")
public record SuperAdminSkillUpdateDTO(
        @Schema(description = "Skill描述") @NotBlank(message = "Skill描述不能为空") @Size(max = 20000, message = "Skill描述长度不能超过20000位") String description,
        @Schema(description = "Skill内容") @NotBlank(message = "Skill内容不能为空") String skillContent
) {
}
