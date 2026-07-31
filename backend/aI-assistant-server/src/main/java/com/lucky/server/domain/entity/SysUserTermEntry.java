package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户术语条目实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_user_term_entry")
@Schema(name = "SysUserTermEntry", description = "系统用户术语条目")
public class SysUserTermEntry implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("library_id")
    @Schema(description = "术语库ID")
    private Long libraryId;

    @TableField("source_term")
    @Schema(description = "原文")
    private String sourceTerm;

    @TableField("target_term")
    @Schema(description = "译文")
    private String targetTerm;

    @TableField("direction")
    @Schema(description = "翻译方向")
    private String direction;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
