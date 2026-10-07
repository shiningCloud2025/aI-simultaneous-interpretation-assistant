package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.MailAccountStatusEnum;
import com.lucky.server.common.enums.MailProviderEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 超管邮箱绑定管理分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管邮箱绑定管理分页查询")
public record SuperAdminMailAccountManagePageQueryDTO(
        @NotNull(message = "页码不能为空") @Min(value = 1, message = "页码不能小于1") @Schema(description = "页码") Integer page,
        @NotNull(message = "每页条数不能为空") @Min(value = 1, message = "每页条数不能小于1") @Max(value = 100, message = "每页条数不能超过100") @Schema(description = "每页条数") Integer size,
        @Valid @Schema(description = "筛选条件") Filter filter
) {

    @Schema(description = "超管邮箱绑定管理筛选条件")
    public record Filter(
            @Size(max = 128, message = "关键字长度不能超过128位") @Schema(description = "关键字，支持邮箱/备注名/用户账号/用户名") String keyword,
            @Schema(description = "邮箱类型") MailProviderEnum provider,
            @Schema(description = "邮箱状态") MailAccountStatusEnum status,
            @Schema(description = "用户类型") UserTypeEnum userType
    ) {
    }
}
