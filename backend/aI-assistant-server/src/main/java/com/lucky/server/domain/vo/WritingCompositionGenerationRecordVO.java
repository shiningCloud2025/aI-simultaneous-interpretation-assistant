package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.CompositionDifficultyEnum;
import com.lucky.server.common.enums.CompositionGenreEnum;
import com.lucky.server.common.enums.CompositionLanguageEnum;
import com.lucky.server.common.enums.CompositionSceneEnum;
import com.lucky.server.common.enums.CompositionStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 写作作文生成记录视图
 * @author shiningCloud2025
 */
@Schema(description = "写作作文生成记录视图")
public record WritingCompositionGenerationRecordVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "是否成功") Boolean success,
        @Schema(description = "语言编码") CompositionLanguageEnum languageCode,
        @Schema(description = "学习阶段编码") CompositionStageEnum stageCode,
        @Schema(description = "题型编码") CompositionGenreEnum genreCode,
        @Schema(description = "难度编码") CompositionDifficultyEnum difficultyCode,
        @Schema(description = "场景编码") CompositionSceneEnum sceneCode,
        @Schema(description = "自定义场景") String customScene,
        @Schema(description = "作文标题") String title,
        @Schema(description = "作文题干") String prompt,
        @Schema(description = "写作要求") String requirement,
        @Schema(description = "最低字数") Integer wordLimitMin,
        @Schema(description = "最高字数") Integer wordLimitMax,
        @Schema(description = "写作要点") List<String> keyPoints,
        @Schema(description = "词汇提示") List<String> vocabularyHints,
        @Schema(description = "结构提示") List<String> structureHints,
        @Schema(description = "评分标准") List<String> scoringCriteria,
        @Schema(description = "厂商标识") String provider,
        @Schema(description = "模型名") String modelName,
        @Schema(description = "失败阶段") String failureStage,
        @Schema(description = "错误编码") String errorCode,
        @Schema(description = "错误信息") String errorMessage,
        @Schema(description = "创建时间") LocalDateTime createTime
) {
}
