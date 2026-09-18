package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.ClassroomSessionStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 课堂课次分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "课堂课次分页查询")
public record ClassroomSessionPageQueryDTO(
        @NotNull(message = "页码不能为空")
        @Min(value = 1, message = "页码不能小于1")
        @Schema(description = "页码")
        Integer page,

        @NotNull(message = "每页条数不能为空")
        @Min(value = 1, message = "每页条数不能小于1")
        @Max(value = 100, message = "每页条数不能超过100")
        @Schema(description = "每页条数")
        Integer size,

        @Valid
        @Schema(description = "筛选条件")
        Filter filter
) {

    @Schema(description = "课堂课次筛选条件")
    public record Filter(
            @Size(max = 64, message = "课次名称关键字长度不能超过64位")
            @Schema(description = "课次名称关键字")
            String keyword,

            @Schema(description = "课次状态")
            ClassroomSessionStatusEnum status
    ) {
    }
}
