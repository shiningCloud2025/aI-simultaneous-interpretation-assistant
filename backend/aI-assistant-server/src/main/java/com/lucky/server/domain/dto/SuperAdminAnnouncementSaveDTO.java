package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.AnnouncementStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 超管公告保存DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管公告保存DTO")
public record SuperAdminAnnouncementSaveDTO(
        @NotBlank(message = "公告标题不能为空") @Size(max = 128, message = "公告标题长度不能超过128位") @Schema(description = "公告标题纯文本") String title,
        @Schema(description = "公告标题富文本内容") String titleContent,
        @NotBlank(message = "公告正文不能为空") @Schema(description = "公告正文富文本内容") String content,
        @Size(max = 512, message = "公告封面图URL长度不能超过512位") @Schema(description = "公告封面图URL") String coverUrl,
        @NotNull(message = "公告状态不能为空") @Schema(description = "公告状态：0草稿，1已发布") AnnouncementStatusEnum status
) {
}
