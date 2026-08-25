package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.CompositionGenreEnum;
import com.lucky.server.common.enums.CompositionLanguageEnum;
import com.lucky.server.common.enums.CompositionStageEnum;
import com.lucky.server.common.enums.CompositionSubmitTypeEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 写作作文评估记录视图
 * @author shiningCloud2025
 */
@Schema(description = "写作作文评估记录视图")
public record WritingCompositionEvaluationRecordVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "是否成功") Boolean success,
        @Schema(description = "作文生成记录ID") Long generationId,
        @Schema(description = "提交类型") CompositionSubmitTypeEnum submitType,
        @Schema(description = "语言编码") CompositionLanguageEnum languageCode,
        @Schema(description = "学习阶段编码") CompositionStageEnum stageCode,
        @Schema(description = "题型编码") CompositionGenreEnum genreCode,
        @Schema(description = "作文题目") String title,
        @Schema(description = "作文题干") String prompt,
        @Schema(description = "评分标准") String scoringCriteria,
        @Schema(description = "作文正文") String content,
        @Schema(description = "作文图片URL列表") List<String> imageUrls,
        @Schema(description = "OCR识别文本") String ocrText,
        @Schema(description = "评分：百分制") BigDecimal score,
        @Schema(description = "整体反馈") String feedback,
        @Schema(description = "修改建议") String suggestion,
        @Schema(description = "作文亮点") List<String> highlights,
        @Schema(description = "重点弥补项") List<String> improvementPoints,
        @Schema(description = "逐句反馈") List<WritingCompositionEvaluateResultVO.SentenceFeedback> sentenceFeedback,
        @Schema(description = "修改后版本") String improvedVersion,
        @Schema(description = "厂商标识") String provider,
        @Schema(description = "模型名") String modelName,
        @Schema(description = "失败阶段") String failureStage,
        @Schema(description = "错误编码") String errorCode,
        @Schema(description = "错误信息") String errorMessage,
        @Schema(description = "创建时间") LocalDateTime createTime
) {
}
