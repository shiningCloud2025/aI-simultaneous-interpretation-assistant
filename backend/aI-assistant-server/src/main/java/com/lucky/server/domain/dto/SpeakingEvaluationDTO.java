package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 口语跟读评测请求
 * @author shiningCloud2025
 */
@Schema(description = "口语跟读评测请求")
public record SpeakingEvaluationDTO(
        @NotNull(message = "口语素材句子ID不能为空") @Schema(description = "口语素材句子ID") Long sentenceId,
        @NotBlank(message = "学生跟读音频URL不能为空") @Schema(description = "学生跟读音频URL") String studentAudioUrl
) {
}