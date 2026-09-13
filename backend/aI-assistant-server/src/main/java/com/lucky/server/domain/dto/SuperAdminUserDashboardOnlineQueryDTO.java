package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.UserTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 超管用户看板在线用户查询条件
 * @author shiningCloud2025
 */
@Schema(description = "超管用户看板在线用户查询条件")
public record SuperAdminUserDashboardOnlineQueryDTO(
        @Schema(description = "用户名模糊搜索") String keyword,
        @Schema(description = "用户类型") UserTypeEnum userType
) {}
