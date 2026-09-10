package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.FeedbackStatusEnum;
import com.lucky.server.common.enums.FeedbackTypeEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 超管反馈列表项VO
 * @author shiningCloud2025
 */
@Schema(description = "超管反馈列表项VO")
public record SuperAdminFeedbackVO(
        @Schema(description = "反馈ID") Long id,
        @Schema(description = "反馈编号") String feedbackNo,
        @Schema(description = "反馈类型") FeedbackTypeEnum type,
        @Schema(description = "反馈类型文案") String typeText,
        @Schema(description = "标题") String title,
        @Schema(description = "内容") String content,
        @Schema(description = "反馈状态") FeedbackStatusEnum status,
        @Schema(description = "反馈状态文案") String statusText,
        @Schema(description = "回复内容") String replyContent,
        @Schema(description = "回复时间") LocalDateTime replyTime,
        @Schema(description = "回复人ID") Long repliedBy,
        @Schema(description = "提交用户ID") Long userId,
        @Schema(description = "提交用户账号") String account,
        @Schema(description = "提交用户名") String username,
        @Schema(description = "提交用户类型") UserTypeEnum userType,
        @Schema(description = "提交用户类型文案") String userTypeText,
        @Schema(description = "反馈图片列表") List<SysFileVO> images,
        @Schema(description = "创建时间") LocalDateTime createTime,
        @Schema(description = "更新时间") LocalDateTime updateTime
) {
}
