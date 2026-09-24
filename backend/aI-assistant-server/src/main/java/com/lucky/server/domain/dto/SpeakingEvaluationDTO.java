package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * 口语评测请求参数
 * @author shiningCloud2025
 */
@Schema(description = "口语评测请求参数")
public record SpeakingEvaluationDTO(
        @Schema(description = "口语素材句子ID")
        @NotNull(message = "口语素材句子ID不能为空")
        Long sentenceId,

        @Schema(description = "学生跟读音频URL")
        @NotBlank(message = "学生跟读音频URL不能为空")
        String studentAudioUrl,

        @Schema(description = "评分苛刻系数（1.0最宽松 ~ 4.0最严格）")
        @NotNull(message = "评分苛刻系数不能为空")
        @DecimalMin(value = "1.0", message = "评分苛刻系数不能小于1.0")
        @DecimalMax(value = "4.0", message = "评分苛刻系数不能大于4.0")
        BigDecimal scoreCoeff
) { }
