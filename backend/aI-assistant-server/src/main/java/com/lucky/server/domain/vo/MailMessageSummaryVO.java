package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 邮件摘要VO
 * @author shiningCloud2025
 */
@Schema(description = "邮件摘要")
public record MailMessageSummaryVO(
        @Schema(description = "邮件UID") Long uid,
        @Schema(description = "邮件主题") String subject,
        @Schema(description = "发件人") String from,
        @Schema(description = "发送时间") LocalDateTime sentDate,
        @Schema(description = "接收时间") LocalDateTime receivedDate,
        @Schema(description = "是否已读") Boolean seen,
        @Schema(description = "是否包含附件") Boolean hasAttachment,
        @Schema(description = "邮件大小") Integer size
) {
}
