package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 邮箱文件夹VO
 * @author shiningCloud2025
 */
@Schema(description = "邮箱文件夹")
public record MailFolderVO(
        @Schema(description = "文件夹名称") String name,
        @Schema(description = "文件夹完整名称") String fullName,
        @Schema(description = "系统类型：INBOX/SENT/DRAFTS/TRASH/SPAM/ARCHIVE/CUSTOM") String systemType,
        @Schema(description = "邮件数量") Integer messageCount,
        @Schema(description = "未读数量") Integer unreadCount
) {
}
