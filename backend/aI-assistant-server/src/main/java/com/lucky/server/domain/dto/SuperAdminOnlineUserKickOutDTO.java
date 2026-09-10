package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * 超管踢出在线用户DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管踢出在线用户DTO")
public record SuperAdminOnlineUserKickOutDTO(
        @Schema(description = "用户ID列表，单个踢出时传一个ID即可") @NotEmpty(message = "用户ID列表不能为空") List<Long> userIds
) {
}
