package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.FeedbackStatusEnum;
import com.lucky.server.common.enums.FeedbackTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统用户反馈实体
 * @author shiningCloud2025
 */
@Data
@TableName("sys_user_feedback")
@Schema(name = "SysUserFeedback", description = "系统用户反馈")
public class SysUserFeedback implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("feedback_no")
    @Schema(description = "反馈编号")
    private String feedbackNo;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("type")
    @Schema(description = "反馈类型")
    private FeedbackTypeEnum type;

    @TableField("title")
    @Schema(description = "标题")
    private String title;

    @TableField("content")
    @Schema(description = "内容")
    private String content;

    @TableField("status")
    @Schema(description = "反馈状态")
    private FeedbackStatusEnum status;

    @TableField("reply_content")
    @Schema(description = "回复内容")
    private String replyContent;

    @TableField("reply_time")
    @Schema(description = "回复时间")
    private LocalDateTime replyTime;

    @TableField("replied_by")
    @Schema(description = "回复人ID")
    private Long repliedBy;

    @TableField("deleted")
    @Schema(description = "逻辑删除")
    private DeletedStatusEnum deleted;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;
}
