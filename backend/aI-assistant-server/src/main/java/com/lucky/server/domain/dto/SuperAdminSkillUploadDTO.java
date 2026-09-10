package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 超管上传 AgentScope Skill DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管上传 AgentScope Skill DTO")
public record SuperAdminSkillUploadDTO(
        @Schema(description = "Skill名称，作为 AgentScope 唯一标识") @NotBlank(message = "Skill名称不能为空") @Size(max = 255, message = "Skill名称长度不能超过255位") @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "Skill名称只能包含英文、数字、下划线和中划线") String name,
        @Schema(description = "Skill描述") @NotBlank(message = "Skill描述不能为空") @Size(max = 20000, message = "Skill描述长度不能超过20000位") String description,
        @Schema(description = "Skill内容") @NotBlank(message = "Skill内容不能为空") String skillContent,
        @Schema(description = "是否覆盖同名Skill") Boolean overwrite
) {
}
