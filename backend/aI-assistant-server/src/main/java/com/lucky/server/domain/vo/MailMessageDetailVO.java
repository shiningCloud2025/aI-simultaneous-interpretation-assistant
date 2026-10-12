package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 邮件详情VO
 * @author shiningCloud2025
 */
@Schema(description = "邮件详情")
public record MailMessageDetailVO(
        @Schema(description = "邮件UID") Long uid,
        @Schema(description = "邮件主题") String subject,
        @Schema(description = "发件人") String from,
        @Schema(description = "收件人") List<String> to,
        @Schema(description = "抄送人") List<String> cc,
        @Schema(description = "发送时间") LocalDateTime sentDate,
        @Schema(description = "接收时间") LocalDateTime receivedDate,
        @Schema(description = "是否已读") Boolean seen,
        @Schema(description = "正文文本") String textContent,
        @Schema(description = "正文HTML") String htmlContent,
        @Schema(description = "附件列表") List<Attachment> attachments
) {

    @Schema(description = "邮件附件信息")
    public record Attachment(
            @Schema(description = "附件定位路径") String partPath,
            @Schema(description = "附件名称") String fileName,
            @Schema(description = "附件类型") String contentType,
            @Schema(description = "附件大小") Integer size
    ) {
    }
}
