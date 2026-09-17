package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.ClassroomMemberJoinTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 课堂成员列表VO
 * @author shiningCloud2025
 */
@Schema(description = "课堂成员列表")
public record ClassroomMemberListVO(
        @Schema(description = "课堂成员ID") Long id,
        @Schema(description = "学生用户ID") Long studentId,
        @Schema(description = "学生在课堂中的真实姓名") String studentName,
        @Schema(description = "加入方式") ClassroomMemberJoinTypeEnum joinType,
        @Schema(description = "加入课堂时间") LocalDateTime joinedTime
) {
}
