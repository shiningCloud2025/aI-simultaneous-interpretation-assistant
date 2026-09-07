package com.lucky.server.agent.speak;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * 口语素材生成 Agent 结果
 * @author shiningCloud2025
 */
@Schema(name = "SpeakingMaterialAgentResult", description = "口语素材生成 Agent 结果")
public record SpeakingMaterialAgentResult(

        @Schema(description = "口语素材标题")
        String title,

        @Schema(description = "口语练习场景说明")
        String sceneDescription,

        @Schema(description = "口语跟读句子")
        List<SpeakingMaterialAgentSentenceResult> sentences
) {
}