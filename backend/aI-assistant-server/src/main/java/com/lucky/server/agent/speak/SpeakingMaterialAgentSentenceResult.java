package com.lucky.server.agent.speak;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 口语素材生成句子 Agent 结果
 * @author shiningCloud2025
 */
@Schema(name = "SpeakingMaterialAgentSentenceResult", description = "口语素材生成句子 Agent 结果")
public record SpeakingMaterialAgentSentenceResult(

        @Schema(description = "句子排序")
        Integer sortOrder,

        @Schema(description = "跟读句子")
        String sentence,

        @Schema(description = "句子译文")
        String translation,

        @Schema(description = "重点词/重点表达")
        List<String> keyPoints,

        @Schema(description = "跟读建议")
        List<String> practiceTips
) {
}