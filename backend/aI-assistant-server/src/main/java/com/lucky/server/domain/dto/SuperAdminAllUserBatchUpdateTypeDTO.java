package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.UserTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 超管全部用户批量修改用户类型DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管全部用户批量修改用户类型DTO")
public record SuperAdminAllUserBatchUpdateTypeDTO(

        @NotEmpty(message = "用户ID列表不能为空")
        @Schema(description = "用户ID列表")
        List<Long> userIds,

        @NotNull(message = "用户类型不能为空")
        @Schema(description = "用户类型，只允许 student / teacher")
        UserTypeEnum userType
) {
}
