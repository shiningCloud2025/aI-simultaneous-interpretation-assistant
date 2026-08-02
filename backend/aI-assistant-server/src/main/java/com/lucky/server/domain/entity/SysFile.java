package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 文件实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_file")
@Schema(name = "SysFile", description = "文件")
public class SysFile implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("url")
    @Schema(description = "文件访问URL")
    private String url;

    @TableField("file_name")
    @Schema(description = "原文件名")
    private String fileName;

    @TableField("file_size")
    @Schema(description = "文件大小（字节）")
    private Integer fileSize;

    @TableField("mime_type")
    @Schema(description = "MIME类型")
    private String mimeType;

    @TableField("file_type")
    @Schema(description = "文件大类")
    private String fileType;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;
}