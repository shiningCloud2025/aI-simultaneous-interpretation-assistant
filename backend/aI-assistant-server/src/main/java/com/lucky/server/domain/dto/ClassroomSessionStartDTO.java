package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 开始课次请求参数
 * @author shiningCloud2025
 */
@Schema(description = "开始课次请求参数")
public record ClassroomSessionStartDTO(
        @NotBlank(message = "课次名称不能为空")
        @Size(max = 64, message = "课次名称长度不能超过64位")
        @Schema(description = "课次名称")
        String sessionName
) {
}
