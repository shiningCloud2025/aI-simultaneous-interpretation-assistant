package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.AnnouncementStatusEnum;
import com.lucky.server.domain.entity.SysAnnouncement;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 公告列表VO
 * @author shiningCloud2025
 */
@Schema(description = "公告列表VO")
public record AnnouncementListVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "公告标题纯文本") String title,
        @Schema(description = "公告封面图URL") String coverUrl,
        @Schema(description = "公告状态") AnnouncementStatusEnum status,
        @Schema(description = "公告状态名称") String statusText,
        @Schema(description = "发布时间") LocalDateTime publishTime,
        @Schema(description = "是否已读") Boolean read,
        @Schema(description = "创建时间") LocalDateTime createTime
) {

    public static AnnouncementListVO from(SysAnnouncement announcement, Boolean read) {
        AnnouncementStatusEnum status = announcement.getStatus();
        return new AnnouncementListVO(
                announcement.getId(),
                announcement.getTitle(),
                announcement.getCoverUrl(),
                status,
                status == null ? null : status.getDesc(),
                announcement.getPublishTime(),
                read,
                announcement.getCreateTime()
        );
    }
}
