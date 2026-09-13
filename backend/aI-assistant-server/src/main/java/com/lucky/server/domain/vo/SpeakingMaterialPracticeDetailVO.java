package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.SpeakingDifficultyEnum;
import com.lucky.server.common.enums.SpeakingLanguageEnum;
import com.lucky.server.common.enums.SpeakingSceneEnum;
import com.lucky.server.common.enums.SpeakingStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 口语素材练习详情视图
 * @author shiningCloud2025
 */
@Schema(description = "口语素材练习详情视图")
public record SpeakingMaterialPracticeDetailVO(
        @Schema(description = "口语素材主表ID") Long materialId,
        @Schema(description = "口语素材标题") String title,
        @Schema(description = "口语练习场景说明") String sceneDescription,
        @Schema(description = "语言编码") SpeakingLanguageEnum languageCode,
        @Schema(description = "学习阶段编码") SpeakingStageEnum stageCode,
        @Schema(description = "难度编码") SpeakingDifficultyEnum difficultyCode,
        @Schema(description = "场景编码") SpeakingSceneEnum sceneCode,
        @Schema(description = "练习句子列表") List<SpeakingMaterialPracticeSentenceVO> sentences
) { }