package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.UserStatusEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 超管用户看板最近注册用户
 * @author shiningCloud2025
 */
@Schema(description = "超管用户看板最近注册用户")
public record SuperAdminUserDashboardRecentRegisterVO(
        @Schema(description = "用户ID") Long userId,
        @Schema(description = "账号") String account,
        @Schema(description = "用户名/昵称") String username,
        @Schema(description = "用户类型") UserTypeEnum userType,
        @Schema(description = "用户类型名称") String userTypeName,
        @Schema(description = "账号状态") UserStatusEnum status,
        @Schema(description = "账号状态名称") String statusName,
        @Schema(description = "最后登录时间") LocalDateTime lastLoginTime,
        @Schema(description = "注册时间") LocalDateTime createTime
) {}