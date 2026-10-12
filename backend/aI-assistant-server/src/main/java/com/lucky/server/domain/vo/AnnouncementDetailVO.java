package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.AnnouncementStatusEnum;
import com.lucky.server.domain.entity.SysAnnouncement;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 公告详情VO
 * @author shiningCloud2025
 */
@Schema(description = "公告详情VO")
public record AnnouncementDetailVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "公告标题纯文本") String title,
        @Schema(description = "公告标题富文本内容") String titleContent,
        @Schema(description = "公告正文富文本内容") String content,
        @Schema(description = "公告封面图URL") String coverUrl,
        @Schema(description = "公告状态") AnnouncementStatusEnum status,
        @Schema(description = "公告状态名称") String statusText,
        @Schema(description = "发布时间") LocalDateTime publishTime,
        @Schema(description = "是否已读") Boolean read,
        @Schema(description = "创建者ID") Long createdById,
        @Schema(description = "创建时间") LocalDateTime createTime,
        @Schema(description = "更新者ID") Long updatedById,
        @Schema(description = "更新时间") LocalDateTime updateTime
) {

    public static AnnouncementDetailVO from(SysAnnouncement announcement, Boolean read) {
        AnnouncementStatusEnum status = announcement.getStatus();
        return new AnnouncementDetailVO(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getTitleContent(),
                announcement.getContent(),
                announcement.getCoverUrl(),
                status,
                status == null ? null : status.getDesc(),
                announcement.getPublishTime(),
                read,
                announcement.getCreatedById(),
                announcement.getCreateTime(),
                announcement.getUpdatedById(),
                announcement.getUpdateTime()
        );
    }
}
