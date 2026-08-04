package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 系统用户模型偏好DTO
 * @author shiningCloud2025
 */
@Schema(description = "模型偏好设置")
public record SysUserModelPreferenceDTO(
        @NotBlank(message = "类型不能为空") @Size(max = 16, message = "类型长度不能超过16位") @Schema(description = "类型：ASR/LLM") String modelType,
        @NotBlank(message = "厂商标识不能为空") @Size(max = 32, message = "厂商标识长度不能超过32位") @Schema(description = "厂商标识") String provider,
        @NotBlank(message = "模型名不能为空") @Size(max = 64, message = "模型名长度不能超过64位") @Schema(description = "模型名") String modelName
) {}
