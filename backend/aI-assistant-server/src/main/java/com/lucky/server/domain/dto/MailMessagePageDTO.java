package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 邮件分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "邮件分页查询")
public record MailMessagePageDTO(
        @NotNull(message = "页码不能为空") @Min(value = 1, message = "页码不能小于1") @Schema(description = "页码") Integer page,
        @NotNull(message = "每页条数不能为空") @Min(value = 1, message = "每页条数不能小于1") @Max(value = 100, message = "每页条数不能超过100") @Schema(description = "每页条数") Integer size,
        @Valid @Schema(description = "筛选条件") Filter filter
) {

    @Schema(description = "邮件分页筛选条件")
    public record Filter(
            @NotBlank(message = "文件夹名称不能为空") @Schema(description = "文件夹完整名称") String folderName
    ) {
    }
}
