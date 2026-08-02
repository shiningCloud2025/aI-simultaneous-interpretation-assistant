package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.FeedbackStatusEnum;
import com.lucky.server.common.enums.FeedbackTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * 用户反馈分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "用户反馈分页查询")
public record FeedbackPageQueryDTO(
        @NotNull(message = "页码不能为空") @Schema(description = "页码") Integer page,
        @NotNull(message = "每页条数不能为空") @Schema(description = "每页条数") Integer size,
        @Schema(description = "筛选条件") Filter filter
) {

    @Schema(description = "反馈筛选条件")
    public record Filter(
            @Schema(description = "反馈标题，模糊搜索") String title,
            @Schema(description = "反馈类型") FeedbackTypeEnum type,
            @Schema(description = "反馈状态") FeedbackStatusEnum status
    ) {}
}
