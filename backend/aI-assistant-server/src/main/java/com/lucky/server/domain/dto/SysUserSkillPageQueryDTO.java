package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * 用户端 Skill 分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "用户端 Skill 分页查询DTO")
public record SysUserSkillPageQueryDTO(
        @Schema(description = "页码") @Min(value = 1, message = "页码不能小于1") Long pageNum,
        @Schema(description = "每页条数") @Min(value = 1, message = "每页条数不能小于1") @Max(value = 100, message = "每页条数不能超过100") Long pageSize,
        @Schema(description = "Skill名称，支持模糊搜索") @Size(max = 255, message = "Skill名称长度不能超过255位") String name
) {
}
