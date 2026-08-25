package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 写作作文生成结果视图
 * @author shiningCloud2025
 */
@Schema(name = "WritingCompositionGenerateResultVO", description = "写作作文生成结果视图")
public record WritingCompositionGenerateResultVO(

        @Schema(description = "作文标题")
        String title,

        @Schema(description = "作文题干")
        String prompt,

        @Schema(description = "写作要求")
        String requirement,

        @Schema(description = "最低字数")
        Integer wordLimitMin,

        @Schema(description = "最高字数")
        Integer wordLimitMax,

        @Schema(description = "写作要点")
        List<String> keyPoints,

        @Schema(description = "词汇提示")
        List<String> vocabularyHints,

        @Schema(description = "结构提示")
        List<String> structureHints,

        @Schema(description = "评分标准")
        List<String> scoringCriteria
) {
}
