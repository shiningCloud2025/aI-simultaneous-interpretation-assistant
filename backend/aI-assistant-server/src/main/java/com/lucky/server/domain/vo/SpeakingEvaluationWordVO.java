package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 口语单词评测结果视图
 * @author shiningCloud2025
 */
@Schema(description = "口语单词评测结果视图")
public record SpeakingEvaluationWordVO(
        @Schema(description = "标准单词") String referenceWord,
        @Schema(description = "识别单词") String word,
        @Schema(description = "发音准确度") Double pronAccuracy,
        @Schema(description = "发音流利度") Double pronFluency,
        @Schema(description = "开始时间，单位毫秒") Integer beginTime,
        @Schema(description = "结束时间，单位毫秒") Integer endTime
) {
}