package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.UserStatusEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 超管用户看板用户结构数据
 * @author shiningCloud2025
 */
@Schema(description = "超管用户看板用户结构数据")
public record SuperAdminUserDashboardStructureVO(
        @Schema(description = "未删除用户总数") Long totalUsers,
        @Schema(description = "用户类型分布") List<TypeItem> typeDistribution,
        @Schema(description = "账号状态分布") List<StatusItem> statusDistribution
) {

    @Schema(description = "用户类型分布项")
    public record TypeItem(
            @Schema(description = "用户类型") UserTypeEnum userType,
            @Schema(description = "用户类型名称") String userTypeName,
            @Schema(description = "数量") Long count,
            @Schema(description = "占比，单位为百分比") Double percent
    ) {}

    @Schema(description = "账号状态分布项")
    public record StatusItem(
            @Schema(description = "账号状态") UserStatusEnum status,
            @Schema(description = "账号状态名称") String statusName,
            @Schema(description = "数量") Long count,
            @Schema(description = "占比，单位为百分比") Double percent
    ) {}
}