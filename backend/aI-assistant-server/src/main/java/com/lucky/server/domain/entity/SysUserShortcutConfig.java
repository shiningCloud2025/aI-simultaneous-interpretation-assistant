package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户快捷键配置实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_user_shortcut_config")
@Schema(name = "SysUserShortcutConfig", description = "系统用户快捷键配置")
public class SysUserShortcutConfig implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("action")
    @Schema(description = "功能动作名")
    private String action;

    @TableField("key_combination")
    @Schema(description = "快捷键键位组合")
    private String keyCombination;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
