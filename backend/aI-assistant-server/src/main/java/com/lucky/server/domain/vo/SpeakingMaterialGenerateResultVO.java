package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 口语素材生成结果视图
 * @author shiningCloud2025
 */
@Schema(name = "SpeakingMaterialGenerateResultVO", description = "口语素材生成结果视图")
public record SpeakingMaterialGenerateResultVO(

        @Schema(description = "口语素材生成记录ID")
        Long id,

        @Schema(description = "口语素材标题")
        String title,

        @Schema(description = "口语练习场景说明")
        String sceneDescription,

        @Schema(description = "口语跟读句子")
        List<SpeakingMaterialGenerateSentenceVO> sentences
) {
}