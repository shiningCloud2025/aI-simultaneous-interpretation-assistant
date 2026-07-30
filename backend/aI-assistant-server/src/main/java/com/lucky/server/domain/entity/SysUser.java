package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.UserStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_user")
@Schema(name = "SysUser",description = "系统用户")
public class SysUser implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id",type= IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("account")
    @Schema(description = "用户账号QQ号5-12位")
    private String account;

    @TableField("username")
    @Schema(description = "用户名/昵称")
    private String username;

    @TableField("password")
    @Schema(description = "密码")
    private String password;

    @TableField("email")
    @Schema(description = "邮箱")
    private String email;

    @TableField("phone")
    @Schema(description = "手机号：兼容中美双区")
    private String phone;

    @TableField("avatar")
    @Schema(description = "OSS头像URL")
    private String avatar;

    @TableField("status")
    @Schema(description = "状态：0禁用，1启用")
    private UserStatusEnum status;

    @TableField("last_login_time")
    @Schema(description = "最后登录时间")
    private LocalDateTime lastLoginTime;

    @TableField("last_login_ip")
    @Schema(description = "最后登录IP")
    private String lastLoginIp;

    @TableField("created_by_id")
    @Schema(description = "创建者ID")
    private Long createdById;

    @TableField(value = "create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("updated_by_id")
    @Schema(description = "更新者ID")
    private Long updatedById;

    @TableField(value = "update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @TableField("deleted")
    @Schema(description = "逻辑删除：0=正常 1=删除")
    private DeletedStatusEnum deleted;

}
