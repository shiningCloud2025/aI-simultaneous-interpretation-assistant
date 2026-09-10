package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.FeedbackStatusEnum;
import com.lucky.server.common.enums.FeedbackTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * 超管反馈分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "超管反馈分页查询DTO")
public record SuperAdminFeedbackPageQueryDTO(
        @Schema(description = "页码") @Min(value = 1, message = "页码不能小于1") Long pageNum,
        @Schema(description = "每页条数") @Min(value = 1, message = "每页条数不能小于1") @Max(value = 100, message = "每页条数不能超过100") Long pageSize,
        @Schema(description = "关键字，支持反馈编号/标题/内容模糊搜索") @Size(max = 128, message = "关键字长度不能超过128位") String keyword,
        @Schema(description = "反馈类型") FeedbackTypeEnum type,
        @Schema(description = "反馈状态") FeedbackStatusEnum status,
        @Schema(description = "提交开始时间") LocalDateTime startTime,
        @Schema(description = "提交结束时间") LocalDateTime endTime
) {
}
