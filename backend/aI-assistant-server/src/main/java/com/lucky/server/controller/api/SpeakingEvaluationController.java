package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SpeakingEvaluationDTO;
import com.lucky.server.domain.vo.SpeakingEvaluationResultVO;
import com.lucky.server.service.SpeakingEvaluationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 口语跟读评测控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("speaking/evaluation")
@RequiredArgsConstructor
@Tag(name = "SpeakingEvaluationController", description = "口语跟读评测")
public class SpeakingEvaluationController {

    private final SpeakingEvaluationService speakingEvaluationService;

    @PostMapping("/evaluate")
    @Operation(summary = "评测口语跟读音频")
    public BaseResult<SpeakingEvaluationResultVO> evaluate(@Valid @RequestBody SpeakingEvaluationDTO dto) {
        return BaseResult.ok(speakingEvaluationService.evaluate(dto));
    }
}