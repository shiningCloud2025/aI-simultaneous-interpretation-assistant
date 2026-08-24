package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;

/**
 * 写作作文评估结果视图
 * @author shiningCloud2025
 */
@Schema(name = "WritingCompositionEvaluateResultVO", description = "写作作文评估结果视图")
public record WritingCompositionEvaluateResultVO(

        @Schema(description = "评分：百分制")
        BigDecimal score,

        @Schema(description = "整体反馈")
        String feedback,

        @Schema(description = "修改建议")
        String suggestion,

        @Schema(description = "作文亮点")
        List<String> highlights,

        @Schema(description = "重点弥补项")
        List<String> improvementPoints,

        @Schema(description = "逐句反馈")
        List<SentenceFeedback> sentenceFeedback,

        @Schema(description = "修改后版本")
        String improvedVersion
) {

    /**
     * 逐句反馈
     *
     * @param index      句子序号
     * @param original   原句
     * @param feedback   句子反馈
     * @param suggestion 修改建议
     */
    public record SentenceFeedback(
            Integer index,
            String original,
            String feedback,
            String suggestion
    ) {
    }
}
