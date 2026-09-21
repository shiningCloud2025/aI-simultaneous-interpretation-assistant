package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.ClassroomLanguageEnum;
import com.lucky.server.common.enums.ClassroomSemesterEnum;
import com.lucky.server.common.enums.ClassroomStageEnum;
import com.lucky.server.common.enums.ClassroomStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 课堂实体
 * @author shiningCloud2025
 */
@Data
@TableName("classroom")
@Schema(name = "Classroom", description = "课堂")
public class Classroom implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("teacher_id")
    @Schema(description = "课堂所属老师用户ID")
    private Long teacherId;

    @TableField("name")
    @Schema(description = "课堂名称")
    private String name;

    @TableField("language_code")
    @Schema(description = "主要教学语言")
    private ClassroomLanguageEnum languageCode;

    @TableField("stage_code")
    @Schema(description = "学习阶段")
    private ClassroomStageEnum stageCode;

    @TableField("academic_year")
    @Schema(description = "学年，例如2026-2027")
    private String academicYear;

    @TableField("semester_code")
    @Schema(description = "学期")
    private ClassroomSemesterEnum semesterCode;

    @TableField("description")
    @Schema(description = "课堂说明，存储富文本HTML内容")
    private String description;

    @TableField("invite_code")
    @Schema(description = "当前有效的课堂邀请码")
    private String inviteCode;

    @TableField("status")
    @Schema(description = "课堂状态：0已归档，1正常")
    private ClassroomStatusEnum status;

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
