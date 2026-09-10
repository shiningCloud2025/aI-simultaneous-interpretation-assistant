package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.UserTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * 超管在线用户分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管在线用户分页查询DTO")
public record SuperAdminOnlineUserPageQueryDTO(
        @Schema(description = "页码") @Min(value = 1, message = "页码不能小于1") Long pageNum,
        @Schema(description = "每页条数") @Min(value = 1, message = "每页条数不能小于1") @Max(value = 100, message = "每页条数不能超过100") Long pageSize,
        @Schema(description = "用户名关键字，支持模糊搜索") @Size(max = 32, message = "用户名关键字长度不能超过32位") String keyword,
        @Schema(description = "用户类型") UserTypeEnum userType
) {
}
