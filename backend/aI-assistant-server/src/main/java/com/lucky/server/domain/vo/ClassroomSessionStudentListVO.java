package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.ClassroomSessionStudentCheckInStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 课次学生记录列表VO
 *
 * @author shiningCloud2025
 */
@Schema(description = "课次学生记录列表")
public record ClassroomSessionStudentListVO(

        @Schema(description = "课次学生记录ID")
        Long id,

        @Schema(description = "课堂成员ID")
        Long classroomMemberId,

        @Schema(description = "学生用户ID")
        Long studentId,

        @Schema(description = "学生姓名快照")
        String studentName,

        @Schema(description = "签到状态")
        ClassroomSessionStudentCheckInStatusEnum checkInStatus,

        @Schema(description = "签到时间")
        LocalDateTime checkInTime

) {
}
