package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.ClassroomSessionStudentCheckInStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 课堂课次学生记录实体
 *
 * @author shiningCloud2025
 */
@Data
@TableName("classroom_session_student")
@Schema(
        name = "ClassroomSessionStudent",
        description = "课堂课次学生记录"
)
public class ClassroomSessionStudent implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("classroom_id")
    @Schema(description = "课堂ID")
    private Long classroomId;

    @TableField("classroom_session_id")
    @Schema(description = "开课记录ID")
    private Long classroomSessionId;

    @TableField("classroom_member_id")
    @Schema(description = "课堂成员ID")
    private Long classroomMemberId;

    @TableField("student_id")
    @Schema(description = "学生用户ID")
    private Long studentId;

    @TableField("student_name")
    @Schema(description = "本次课程中的学生姓名快照")
    private String studentName;

    @TableField("check_in_status")
    @Schema(description = "签到状态")
    private ClassroomSessionStudentCheckInStatusEnum checkInStatus;

    @TableField("check_in_time")
    @Schema(description = "签到时间")
    private LocalDateTime checkInTime;

    @TableField("created_by_id")
    @Schema(description = "创建者用户ID")
    private Long createdById;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("updated_by_id")
    @Schema(description = "更新者用户ID")
    private Long updatedById;

    @TableField("update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @TableField("deleted")
    @Schema(description = "逻辑删除：0正常，1删除")
    private DeletedStatusEnum deleted;
}
