package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 口语跟读评测结果视图
 * @author shiningCloud2025
 */
@Schema(description = "口语跟读评测结果视图")
public record SpeakingEvaluationResultVO(
        @Schema(description = "音频流唯一标识") String voiceId,
        @Schema(description = "口语素材句子ID") Long sentenceId,
        @Schema(description = "标准跟读文本") String refText,
        @Schema(description = "识别文本") String recognizedText,
        @Schema(description = "建议得分") Double suggestedScore,
        @Schema(description = "发音准确度") Double pronAccuracy,
        @Schema(description = "发音流利度") Double pronFluency,
        @Schema(description = "发音完整度") Double pronCompletion,
        @Schema(description = "单词评测结果") List<SpeakingEvaluationWordVO> words,
        @Schema(description = "腾讯云原始响应") String rawResponse
) {
}