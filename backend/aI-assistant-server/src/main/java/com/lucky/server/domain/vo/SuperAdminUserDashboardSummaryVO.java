package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 用户看板核心指标
 * @author shiningCloud2025
 */
@Schema(description = "用户看板核心指标")
public record SuperAdminUserDashboardSummaryVO(
        @Schema(description = "总用户数") Metric totalUsers,
        @Schema(description = "今日新增用户数") Metric todayNewUsers,
        @Schema(description = "本月新增用户数") Metric monthNewUsers,
        @Schema(description = "日活跃用户数") ActiveMetric dau,
        @Schema(description = "周活跃用户数") ActiveMetric wau,
        @Schema(description = "月活跃用户数") ActiveMetric mau
) {

    @Schema(description = "普通指标")
    public record Metric(
            @Schema(description = "当前值") Long value,
            @Schema(description = "对比值，单位为百分比，例如 12.4 表示 12.4%") Double comparePercent,
            @Schema(description = "对比文案，例如 较上月、较昨日") String compareText
    ) {}

    @Schema(description = "活跃指标")
    public record ActiveMetric(
            @Schema(description = "当前值") Long value,
            @Schema(description = "活跃率，单位为百分比，例如 7.2 表示 7.2%") Double activeRate
    ) {}
}