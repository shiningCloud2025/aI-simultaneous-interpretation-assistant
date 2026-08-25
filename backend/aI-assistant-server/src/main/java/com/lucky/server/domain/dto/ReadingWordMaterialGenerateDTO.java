package com.lucky.server.domain.dto;

import com.lucky.server.common.enums.ReadingLanguageEnum;
import com.lucky.server.common.enums.ReadingStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 阅读单词素材生成请求参数
 * @author shiningCloud2025
 */
@Schema(name = "ReadingWordMaterialGenerateDTO", description = "阅读单词素材生成请求参数")
public record ReadingWordMaterialGenerateDTO(

        @Schema(description = "单词/词语")
        @NotBlank(message = "单词不能为空")
        String word,

        @Schema(description = "语言编码")
        @NotNull(message = "语言不能为空")
        ReadingLanguageEnum languageCode,

        @Schema(description = "学习阶段编码")
        @NotNull(message = "学习阶段不能为空")
        ReadingStageEnum stageCode
) {
}
