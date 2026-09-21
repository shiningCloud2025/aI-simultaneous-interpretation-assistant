package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.ClassroomLanguageEnum;
import com.lucky.server.common.enums.ClassroomSemesterEnum;
import com.lucky.server.common.enums.ClassroomStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 创建课堂请求参数
 * @author shiningCloud2025
 */
@Schema(description = "创建课堂请求参数")
public record ClassroomCreateDTO(
        @NotBlank(message = "课堂名称不能为空") @Size(max = 64, message = "课堂名称长度不能超过64位") @Schema(description = "课堂名称") String name,
        @NotNull(message = "教学语言不能为空") @Schema(description = "主要教学语言") ClassroomLanguageEnum languageCode,
        @Schema(description = "学习阶段") ClassroomStageEnum stageCode,
        @Pattern(regexp = "^\\d{4}-\\d{4}$", message = "学年格式必须为YYYY-YYYY") @Schema(description = "学年，例如2026-2027") String academicYear,
        @Schema(description = "学期") ClassroomSemesterEnum semesterCode,
        @Size(max = 10000, message = "课堂说明长度不能超过10000位") @Schema(description = "课堂说明，存储富文本HTML内容") String description
) {}
