package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 口语素材生成句子视图
 * @author shiningCloud2025
 */
@Schema(name = "SpeakingMaterialGenerateSentenceVO", description = "口语素材生成句子视图")
public record SpeakingMaterialGenerateSentenceVO(

        @Schema(description = "口语素材句子明细ID")
        Long sentenceId,

        @Schema(description = "句子排序")
        Integer sortOrder,

        @Schema(description = "跟读句子")
        String sentence,

        @Schema(description = "句子译文")
        String translation,

        @Schema(description = "标准跟读音频URL")
        String standardAudioUrl,

        @Schema(description = "重点词/重点表达")
        List<String> keyPoints,

        @Schema(description = "跟读建议")
        List<String> practiceTips
) { }