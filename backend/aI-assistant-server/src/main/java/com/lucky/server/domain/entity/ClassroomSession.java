package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.ClassroomSessionStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 课堂开课记录实体
 * @author shiningCloud2025
 */
@Data
@TableName("classroom_session")
@Schema(name = "ClassroomSession", description = "课堂开课记录")
public class ClassroomSession implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("classroom_id")
    @Schema(description = "课堂ID")
    private Long classroomId;

    @TableField("teacher_id")
    @Schema(description = "开课老师用户ID")
    private Long teacherId;

    @TableField("session_name")
    @Schema(description = "课次名称")
    private String sessionName;

    @TableField("status")
    @Schema(description = "开课状态")
    private ClassroomSessionStatusEnum status;

    @TableField("start_time")
    @Schema(description = "首次开课时间")
    private LocalDateTime startTime;

    @TableField("end_time")
    @Schema(description = "结束时间")
    private LocalDateTime endTime;

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
