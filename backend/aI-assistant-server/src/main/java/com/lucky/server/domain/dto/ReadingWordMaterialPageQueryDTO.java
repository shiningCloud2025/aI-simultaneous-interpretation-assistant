package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.ReadingLanguageEnum;
import com.lucky.server.common.enums.ReadingStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * 阅读单词素材分页查询DTO
 * @author shiningCloud2025
 */
@Schema(description = "阅读单词素材分页查询")
public record ReadingWordMaterialPageQueryDTO(
        @NotNull(message = "页码不能为空") @Schema(description = "页码") Integer page,
        @NotNull(message = "每页条数不能为空") @Schema(description = "每页条数") Integer size,
        @Schema(description = "筛选条件") Filter filter
) {

    @Schema(description = "阅读单词素材筛选条件")
    public record Filter(
            @Schema(description = "是否成功：true=成功 false=失败，默认成功") Boolean success,
            @Schema(description = "单词/词语，模糊搜索") String word,
            @Schema(description = "语言编码") ReadingLanguageEnum languageCode,
            @Schema(description = "学习阶段编码") ReadingStageEnum stageCode
    ) {}
}
