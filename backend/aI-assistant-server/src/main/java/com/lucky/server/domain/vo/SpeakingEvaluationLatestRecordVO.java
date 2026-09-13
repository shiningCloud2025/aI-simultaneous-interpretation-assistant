package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 口语跟读最新评测记录视图
 * @author shiningCloud2025
 */
@Schema(description = "口语跟读最新评测记录视图")
public record SpeakingEvaluationLatestRecordVO(
        @Schema(description = "评测记录ID") Long recordId,
        @Schema(description = "学生跟读音频URL") String studentAudioUrl,
        @Schema(description = "识别文本") String recognizedText,
        @Schema(description = "建议得分") BigDecimal suggestedScore,
        @Schema(description = "发音准确度") BigDecimal pronAccuracy,
        @Schema(description = "发音流利度") BigDecimal pronFluency,
        @Schema(description = "发音完整度") BigDecimal pronCompletion,
        @Schema(description = "单词评测结果") List<SpeakingEvaluationWordVO> words,
        @Schema(description = "创建时间") LocalDateTime createTime
) { }