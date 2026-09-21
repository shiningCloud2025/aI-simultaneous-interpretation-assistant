package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.ClassroomSessionStudentCheckInStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 课次学生记录分页查询DTO
 *
 * @author shiningCloud2025
 */
@Schema(description = "课次学生记录分页查询")
public record ClassroomSessionStudentPageQueryDTO(

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

    /**
     * 课次学生记录筛选条件
     *
     * @param studentName 学生姓名关键字
     * @param checkInStatus 签到状态
     */
    @Schema(description = "课次学生记录筛选条件")
    public record Filter(

            @Size(
                    max = 32,
                    message = "学生姓名关键字长度不能超过32位"
            )
            @Schema(description = "学生姓名关键字")
            String studentName,

            @Schema(description = "签到状态")
            ClassroomSessionStudentCheckInStatusEnum checkInStatus

    ) {
    }
}
