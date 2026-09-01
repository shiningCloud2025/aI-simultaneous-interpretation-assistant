package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.ReadingLanguageEnum;
import com.lucky.server.common.enums.ReadingStageEnum;
import com.lucky.server.common.enums.ReadingWordMaterialFailureStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 阅读单词素材记录视图
 * @author shiningCloud2025
 */
@Schema(description = "阅读单词素材记录视图")
public record ReadingWordMaterialRecordVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "是否成功") Boolean success,
        @Schema(description = "单词/词语") String word,
        @Schema(description = "语言编码") ReadingLanguageEnum languageCode,
        @Schema(description = "学习阶段编码") ReadingStageEnum stageCode,
        @Schema(description = "例句") String sentence,
        @Schema(description = "例句译文") String translation,
        @Schema(description = "图片生成提示词") String imagePrompt,
        @Schema(description = "单词配图URL") String imageUrl,
        @Schema(description = "句子生成厂商标识") String provider,
        @Schema(description = "句子生成模型名") String modelName,
        @Schema(description = "图片生成厂商标识") String imageProvider,
        @Schema(description = "图片生成模型名") String imageModelName,
        @Schema(description = "失败阶段") ReadingWordMaterialFailureStageEnum failureStage,
        @Schema(description = "错误编码") String errorCode,
        @Schema(description = "错误信息") String errorMessage,
        @Schema(description = "创建时间") LocalDateTime createTime
) {
}
