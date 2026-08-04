package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户模型偏好实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_user_model_preference")
@Schema(name = "SysUserModelPreference", description = "系统用户模型偏好")
public class SysUserModelPreference implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("model_type")
    @Schema(description = "类型：ASR/LLM")
    private ApiKeyTypeEnum modelType;

    @TableField("provider")
    @Schema(description = "厂商标识")
    private String provider;

    @TableField("model_name")
    @Schema(description = "模型名")
    private String modelName;

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
