package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.FeedbackTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 用户反馈提交DTO
 * @author shiningCloud2025
 */
@Schema(description = "用户反馈提交")
public record SysUserFeedbackSubmitDTO(
        @NotNull(message = "反馈类型不能为空") @Schema(description = "反馈类型") FeedbackTypeEnum type,
        @NotBlank(message = "标题不能为空") @Size(max = 128, message = "标题长度不能超过128位") @Schema(description = "标题") String title,
        @NotBlank(message = "内容不能为空") @Size(max = 2000, message = "内容长度不能超过2000位") @Schema(description = "内容") String content,
        @Schema(description = "附件文件ID列表") List<Long> fileIds
) {}
