package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.MailAccountStatusEnum;
import com.lucky.server.common.enums.MailProviderEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户邮箱绑定账号实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_user_mail_account")
@Schema(name = "SysUserMailAccount", description = "系统用户邮箱绑定账号")
public class SysUserMailAccount implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("provider")
    @Schema(description = "邮箱类型：QQ/NETEASE_163")
    private MailProviderEnum provider;

    @TableField("email")
    @Schema(description = "邮箱账号/邮箱地址")
    private String email;

    @TableField("display_name")
    @Schema(description = "邮箱备注名")
    private String displayName;

    @TableField("mail_auth_code")
    @Schema(description = "邮箱客户端授权码，加密存储")
    private String mailAuthCode;

    @TableField("access_password")
    @Schema(description = "平台内访问密码")
    private String accessPassword;

    @TableField("imap_host")
    @Schema(description = "IMAP服务器")
    private String imapHost;

    @TableField("imap_port")
    @Schema(description = "IMAP端口")
    private Integer imapPort;

    @TableField("smtp_host")
    @Schema(description = "SMTP服务器")
    private String smtpHost;

    @TableField("smtp_port")
    @Schema(description = "SMTP端口")
    private Integer smtpPort;

    @TableField("status")
    @Schema(description = "状态：0=未测试 1=可用 2=不可用 3=禁用")
    private MailAccountStatusEnum status;

    @TableField("last_test_time")
    @Schema(description = "最后测试时间")
    private LocalDateTime lastTestTime;

    @TableField("last_error")
    @Schema(description = "最后错误信息")
    private String lastError;

    @TableField("created_by_id")
    @Schema(description = "创建者ID")
    private Long createdById;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("updated_by_id")
    @Schema(description = "更新者ID")
    private Long updatedById;

    @TableField("update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @TableField("deleted")
    @Schema(description = "逻辑删除：0=正常 1=删除")
    private DeletedStatusEnum deleted;
}
