package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * API Key配置DTO
 * @author shiningCloud2025
 */
@Schema(description = "API Key配置")
public record SysUserApiKeyDTO(
        @NotBlank(message = "厂商标识不能为空") @Size(max = 32, message = "厂商标识长度不能超过32位") @Schema(description = "厂商标识") String provider,
        @NotBlank(message = "类型不能为空") @Size(max = 16, message = "类型长度不能超过16位") @Schema(description = "类型：ASR/LLM") String keyType,
        @NotBlank(message = "API Key不能为空") @Size(max = 512, message = "API Key长度不能超过512位") @Schema(description = "API Key") String apiKey
) {}
