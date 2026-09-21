package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.ClassroomMemberJoinTypeEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 课堂成员实体
 * @author shiningCloud2025
 */
@Data
@TableName("classroom_member")
@Schema(name = "ClassroomMember", description = "课堂成员")
public class ClassroomMember implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("classroom_id")
    @Schema(description = "课堂ID")
    private Long classroomId;

    @TableField("student_id")
    @Schema(description = "学生用户ID")
    private Long studentId;

    @TableField("student_name")
    @Schema(description = "学生在当前课堂使用的真实姓名")
    private String studentName;

    @TableField("join_type")
    @Schema(description = "加入方式")
    private ClassroomMemberJoinTypeEnum joinType;

    @TableField("joined_time")
    @Schema(description = "加入课堂时间")
    private LocalDateTime joinedTime;

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
