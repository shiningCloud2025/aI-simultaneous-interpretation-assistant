package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 修改课堂请求参数
 * @author shiningCloud2025
 */
@Schema(description = "修改课堂请求参数")
public record ClassroomUpdateDTO(
        @NotBlank(message = "课堂名称不能为空") @Size(max = 64, message = "课堂名称长度不能超过64位") @Schema(description = "课堂名称") String name,
        @Size(max = 10000, message = "课堂说明长度不能超过10000位") @Schema(description = "课堂说明，存储富文本HTML内容") String description
) {}
