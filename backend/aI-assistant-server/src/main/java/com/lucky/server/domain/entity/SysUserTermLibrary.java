package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户术语库实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_user_term_library")
@Schema(name = "SysUserTermLibrary", description = "系统用户术语库")
public class SysUserTermLibrary implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("name")
    @Schema(description = "术语库名称")
    private String name;

    @TableField("is_default")
    @Schema(description = "是否默认库")
    private Integer isDefault;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
