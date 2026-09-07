package com.lucky.server.controller.api;

import com.lucky.server.agent.speak.SpeakingMaterialGenerateAgent;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SpeakingMaterialGenerateDTO;
import com.lucky.server.domain.vo.SpeakingMaterialGenerateResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * 口语素材控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("speaking/material")
@RequiredArgsConstructor
@Tag(name = "SpeakingMaterialController", description = "口语素材")
public class SpeakingMaterialController {

    private final SpeakingMaterialGenerateAgent speakingMaterialGenerateAgent;

    @PostMapping("/generate")
    @Operation(summary = "生成口语跟读素材")
    public Mono<BaseResult<SpeakingMaterialGenerateResultVO>> generate(
            @Valid @RequestBody SpeakingMaterialGenerateDTO dto) {
        return speakingMaterialGenerateAgent.generate(dto)
                .map(BaseResult::ok);
    }
}