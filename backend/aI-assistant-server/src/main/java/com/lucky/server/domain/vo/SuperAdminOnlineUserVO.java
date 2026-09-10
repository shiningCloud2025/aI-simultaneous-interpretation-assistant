package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.UserStatusEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 超管在线用户VO
 * @author shiningCloud2025
 */
@Schema(description = "超管在线用户VO")
public record SuperAdminOnlineUserVO(
        @Schema(description = "用户ID") Long id,
        @Schema(description = "账号") String account,
        @Schema(description = "用户名") String username,
        @Schema(description = "头像URL") String avatar,
        @Schema(description = "用户类型") UserTypeEnum userType,
        @Schema(description = "用户类型文案") String userTypeText,
        @Schema(description = "账号状态") UserStatusEnum status,
        @Schema(description = "账号状态文案") String statusText,
        @Schema(description = "最近登录时间") LocalDateTime lastLoginTime,
        @Schema(description = "最近登录IP") String lastLoginIp
) {
}
