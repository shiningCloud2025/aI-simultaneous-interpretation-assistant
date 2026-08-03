package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.FeedbackStatusEnum;
import com.lucky.server.common.enums.FeedbackTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户反馈详情
 * @author shiningCloud2025
 */
@Schema(description = "用户反馈详情")
public record SysUserFeedbackDetailVO(
        @Schema(description = "反馈ID") Long id,
        @Schema(description = "反馈编号") String feedbackNo,
        @Schema(description = "反馈类型") FeedbackTypeEnum type,
        @Schema(description = "标题") String title,
        @Schema(description = "内容") String content,
        @Schema(description = "状态") FeedbackStatusEnum status,
        @Schema(description = "回复内容") String replyContent,
        @Schema(description = "回复时间") LocalDateTime replyTime,
        @Schema(description = "附件列表") List<SysFileVO> attachments,
        @Schema(description = "创建时间") LocalDateTime createTime
) {}
