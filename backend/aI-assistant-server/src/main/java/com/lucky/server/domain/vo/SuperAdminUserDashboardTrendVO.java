package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

/**
 * 超管用户增长趋势
 * @author shiningCloud2025
 */
@Schema(description = "超管用户增长趋势")
public record SuperAdminUserDashboardTrendVO(
        @Schema(description = "日期") LocalDate date,
        @Schema(description = "每日新增用户数") Long newUsers,
        @Schema(description = "截至当天累计用户数") Long totalUsers
) {}