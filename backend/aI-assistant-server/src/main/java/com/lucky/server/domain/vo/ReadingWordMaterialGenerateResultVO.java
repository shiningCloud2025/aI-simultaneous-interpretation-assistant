package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 阅读单词素材生成结果视图
 * @author shiningCloud2025
 */
@Schema(name = "ReadingWordMaterialGenerateResultVO", description = "阅读单词素材生成结果视图")
public record ReadingWordMaterialGenerateResultVO(

        @Schema(description = "例句")
        String sentence,

        @Schema(description = "例句译文")
        String translation,

        @Schema(description = "图片生成提示词")
        String imagePrompt,

        @Schema(description = "单词配图URL")
        String imageUrl
) {
}
