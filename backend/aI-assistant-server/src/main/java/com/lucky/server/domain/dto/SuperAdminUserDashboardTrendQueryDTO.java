package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

/**
 * 超管用户看板增长趋势查询条件
 * @author shiningCloud2025
 */
@Schema(description = "超管用户看板增长趋势查询条件")
public record SuperAdminUserDashboardTrendQueryDTO(
        @Schema(description = "开始日期，不传默认最近7天") LocalDate startDate,
        @Schema(description = "结束日期，不传默认今天") LocalDate endDate
) {}