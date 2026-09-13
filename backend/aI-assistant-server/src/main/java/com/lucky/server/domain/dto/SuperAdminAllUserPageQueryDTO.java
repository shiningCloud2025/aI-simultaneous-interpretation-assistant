package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.UserStatusEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 超管全部用户分页查询条件
 * @author shiningCloud2025
 */
@Schema(description = "超管全部用户分页查询条件")
public record SuperAdminAllUserPageQueryDTO(
        @Schema(description = "页码，不传默认1") Long pageNum,
        @Schema(description = "每页数量，不传默认10，最大100") Long pageSize,
        @Schema(description = "关键字，按账号/用户名/手机号/邮箱模糊搜索") String keyword,
        @Schema(description = "用户类型：student学生 / teacher老师") UserTypeEnum userType,
        @Schema(description = "账号状态：0禁用，1启用") UserStatusEnum status,
        @Schema(description = "注册开始时间") LocalDateTime startTime,
        @Schema(description = "注册结束时间") LocalDateTime endTime
) {}
