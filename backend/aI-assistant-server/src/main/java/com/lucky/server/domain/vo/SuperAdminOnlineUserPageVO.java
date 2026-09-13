package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 超管在线用户分页VO
 * @author shiningCloud2025
 */
@Schema(description = "超管在线用户分页VO")
public record SuperAdminOnlineUserPageVO(
        @Schema(description = "当前页码") Long pageNum,
        @Schema(description = "每页条数") Long pageSize,
        @Schema(description = "筛选后的在线用户总数") Long total,
        @Schema(description = "当前在线用户总数，不受筛选条件影响") Long totalOnline,
        @Schema(description = "当前在线学生数，不受筛选条件影响") Long studentOnline,
        @Schema(description = "当前在线老师数，不受筛选条件影响") Long teacherOnline,
        @Schema(description = "在线用户列表") List<SuperAdminOnlineUserVO> records
) {
}
