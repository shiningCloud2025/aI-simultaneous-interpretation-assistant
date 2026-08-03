package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户API Key实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_user_api_key")
@Schema(name = "SysUserApiKey", description = "系统用户API Key")
public class SysUserApiKey implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("provider")
    @Schema(description = "厂商标识")
    private String provider;

    @TableField("key_type")
    @Schema(description = "类型：ASR/LLM")
    private ApiKeyTypeEnum keyType;

    @TableField("api_key")
    @Schema(description = "API Key(加密存储)")
    private String apiKey;

    @TableField("status")
    @Schema(description = "状态：0=未测试 1=可用 2=不可用")
    private Integer status;

    @TableField("last_test_time")
    @Schema(description = "最后测试时间")
    private LocalDateTime lastTestTime;

    @TableField(value = "create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField(value = "update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @TableField("deleted")
    @Schema(description = "逻辑删除：0=正常 1=删除")
    private Integer deleted;
}
