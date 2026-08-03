package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.AttachmentBizTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 业务附件关联实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_attachment")
@Schema(name = "SysAttachment", description = "业务附件关联")
public class SysAttachment implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("file_id")
    @Schema(description = "文件ID")
    private Long fileId;

    @TableField("biz_type")
    @Schema(description = "业务类型")
    private AttachmentBizTypeEnum bizType;

    @TableField("biz_id")
    @Schema(description = "业务记录ID")
    private Long bizId;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;
}