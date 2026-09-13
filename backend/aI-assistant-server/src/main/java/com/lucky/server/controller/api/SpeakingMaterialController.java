package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.agent.speak.SpeakingMaterialGenerateAgent;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SpeakingMaterialGenerateDTO;
import com.lucky.server.domain.dto.SpeakingMaterialPageQueryDTO;
import com.lucky.server.domain.vo.SpeakingMaterialGenerateResultVO;
import com.lucky.server.domain.vo.SpeakingMaterialPracticeDetailVO;
import com.lucky.server.domain.vo.SpeakingMaterialRecordVO;
import com.lucky.server.service.SpeakingMaterialGenerationService;
import com.lucky.server.service.SpeakingMaterialSentenceService;
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
    private final SpeakingMaterialGenerationService speakingMaterialGenerationService;
    private final SpeakingMaterialSentenceService speakingMaterialSentenceService;

    @PostMapping("/generate")
    @Operation(summary = "生成口语跟读素材")
    public Mono<BaseResult<SpeakingMaterialGenerateResultVO>> generate(
            @Valid @RequestBody SpeakingMaterialGenerateDTO dto) {
        return speakingMaterialGenerateAgent.generate(dto)
                .map(BaseResult::ok);
    }

    @PostMapping("/history/page")
    @Operation(summary = "分页查询口语素材历史")
    public BaseResult<Page<SpeakingMaterialRecordVO>> pageHistory(
            @Valid @RequestBody SpeakingMaterialPageQueryDTO dto) {
        return BaseResult.ok(speakingMaterialGenerationService.pageMyMaterialHistory(dto));
    }

    @GetMapping("/{materialId}/practice-detail")
    @Operation(summary = "查询口语素材练习详情")
    public BaseResult<SpeakingMaterialPracticeDetailVO> getPracticeDetail(@PathVariable Long materialId) {
        return BaseResult.ok(speakingMaterialSentenceService.getPracticeDetail(materialId));
    }
}
