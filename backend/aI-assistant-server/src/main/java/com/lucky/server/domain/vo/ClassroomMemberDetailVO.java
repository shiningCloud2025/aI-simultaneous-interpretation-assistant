package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.ClassroomMemberJoinTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 课堂成员详情VO
 * @author shiningCloud2025
 */
@Schema(description = "课堂成员详情")
public record ClassroomMemberDetailVO(
        @Schema(description = "课堂成员ID") Long id,
        @Schema(description = "课堂ID") Long classroomId,
        @Schema(description = "学生用户ID") Long studentId,
        @Schema(description = "学生在课堂中的真实姓名") String studentName,
        @Schema(description = "加入方式") ClassroomMemberJoinTypeEnum joinType,
        @Schema(description = "加入课堂时间") LocalDateTime joinedTime,
        @Schema(description = "更新时间") LocalDateTime updateTime
) {
}
