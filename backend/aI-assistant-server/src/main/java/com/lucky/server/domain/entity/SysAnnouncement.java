package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.lucky.server.common.enums.AnnouncementStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统公告实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_announcement")
@Schema(name = "SysAnnouncement", description = "系统公告")
public class SysAnnouncement implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("title")
    @Schema(description = "公告标题纯文本")
    private String title;

    @TableField("title_content")
    @Schema(description = "公告标题富文本内容")
    private String titleContent;

    @TableField("content")
    @Schema(description = "公告正文富文本内容")
    private String content;

    @TableField("cover_url")
    @Schema(description = "公告封面图URL")
    private String coverUrl;

    @TableField("status")
    @Schema(description = "状态：0=草稿 1=已发布")
    private AnnouncementStatusEnum status;

    @TableField("publish_time")
    @Schema(description = "发布时间")
    private LocalDateTime publishTime;

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
