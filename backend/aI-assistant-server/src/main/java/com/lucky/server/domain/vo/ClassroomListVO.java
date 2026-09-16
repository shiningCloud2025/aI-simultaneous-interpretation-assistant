package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.ClassroomLanguageEnum;
import com.lucky.server.common.enums.ClassroomSemesterEnum;
import com.lucky.server.common.enums.ClassroomStageEnum;
import com.lucky.server.common.enums.ClassroomStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 课堂列表VO
 * @author shiningCloud2025
 */
@Schema(description = "课堂列表")
public record ClassroomListVO(
        @Schema(description = "课堂ID") Long id,
        @Schema(description = "课堂名称") String name,
        @Schema(description = "主要教学语言") ClassroomLanguageEnum languageCode,
        @Schema(description = "学习阶段") ClassroomStageEnum stageCode,
        @Schema(description = "学年，例如2026-2027") String academicYear,
        @Schema(description = "学期") ClassroomSemesterEnum semesterCode,
        @Schema(description = "当前有效的课堂邀请码") String inviteCode,
        @Schema(description = "课堂状态") ClassroomStatusEnum status,
        @Schema(description = "创建时间") LocalDateTime createTime,
        @Schema(description = "更新时间") LocalDateTime updateTime
) {}
