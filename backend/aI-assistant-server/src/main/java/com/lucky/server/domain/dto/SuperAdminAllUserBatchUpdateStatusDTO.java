package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.UserStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 超管全部用户批量修改账号状态DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管全部用户批量修改账号状态DTO")
public record SuperAdminAllUserBatchUpdateStatusDTO(

        @NotEmpty(message = "用户ID列表不能为空")
        @Schema(description = "用户ID列表")
        List<Long> userIds,

        @NotNull(message = "账号状态不能为空")
        @Schema(description = "账号状态")
        UserStatusEnum status
) {
}
