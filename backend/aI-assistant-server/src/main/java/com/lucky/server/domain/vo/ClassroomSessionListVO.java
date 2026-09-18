package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.ClassroomSessionStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 课堂课次列表VO
 * @author shiningCloud2025
 */
@Schema(description = "课堂课次列表")
public record ClassroomSessionListVO(
        @Schema(description = "课次ID") Long id,
        @Schema(description = "开课老师用户ID") Long teacherId,
        @Schema(description = "课次名称") String sessionName,
        @Schema(description = "课次状态") ClassroomSessionStatusEnum status,
        @Schema(description = "首次开课时间") LocalDateTime startTime,
        @Schema(description = "结束时间") LocalDateTime endTime
) {
}
