package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.SpeakingDifficultyEnum;
import com.lucky.server.common.enums.SpeakingLanguageEnum;
import com.lucky.server.common.enums.SpeakingSceneEnum;
import com.lucky.server.common.enums.SpeakingStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * 口语素材分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "口语素材分页查询")
public record SpeakingMaterialPageQueryDTO(
        @NotNull(message = "页码不能为空") @Schema(description = "页码") Integer page,
        @NotNull(message = "每页条数不能为空") @Schema(description = "每页条数") Integer size,
        @Schema(description = "筛选条件") Filter filter
) {

    @Schema(description = "口语素材筛选条件")
    public record Filter(
            @Schema(description = "素材标题，模糊搜索") String title,
            @Schema(description = "语言编码") SpeakingLanguageEnum languageCode,
            @Schema(description = "学习阶段编码") SpeakingStageEnum stageCode,
            @Schema(description = "难度编码") SpeakingDifficultyEnum difficultyCode,
            @Schema(description = "场景编码") SpeakingSceneEnum sceneCode
    ) {}
}