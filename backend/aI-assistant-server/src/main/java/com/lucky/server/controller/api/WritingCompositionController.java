package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.agent.write.WritingCompositionEvaluateAgent;
import com.lucky.server.agent.write.WritingCompositionGenerateAgent;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.WritingCompositionEvaluateDTO;
import com.lucky.server.domain.dto.WritingCompositionEvaluationPageQueryDTO;
import com.lucky.server.domain.dto.WritingCompositionGenerationPageQueryDTO;
import com.lucky.server.domain.dto.WritingCompositionGenerateDTO;
import com.lucky.server.domain.vo.WritingCompositionEvaluationRecordVO;
import com.lucky.server.domain.vo.WritingCompositionEvaluateResultVO;
import com.lucky.server.domain.vo.WritingCompositionGenerationRecordVO;
import com.lucky.server.domain.vo.WritingCompositionGenerateResultVO;
import com.lucky.server.service.WritingCompositionEvaluationService;
import com.lucky.server.service.WritingCompositionGenerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * 写作作文控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("writing/composition")
@RequiredArgsConstructor
@Tag(name = "WritingCompositionController", description = "写作作文")
public class WritingCompositionController {

    private final WritingCompositionGenerateAgent writingCompositionGenerateAgent;
    private final WritingCompositionEvaluateAgent writingCompositionEvaluateAgent;
    private final WritingCompositionGenerationService writingCompositionGenerationService;
    private final WritingCompositionEvaluationService writingCompositionEvaluationService;

    @PostMapping("/generate")
    @Operation(summary = "生成作文题目")
    public Mono<BaseResult<WritingCompositionGenerateResultVO>> generate(
            @Valid @RequestBody WritingCompositionGenerateDTO dto) {
        return writingCompositionGenerateAgent.generate(dto)
                .map(BaseResult::ok);
    }

    @PostMapping("/evaluate")
    @Operation(summary = "评估作文")
    public Mono<BaseResult<WritingCompositionEvaluateResultVO>> evaluate(
            @Valid @RequestBody WritingCompositionEvaluateDTO dto) {
        return writingCompositionEvaluateAgent.evaluate(dto)
                .map(BaseResult::ok);
    }

    @PostMapping("/generation/history/page")
    @Operation(summary = "分页查询作文生成历史")
    public BaseResult<Page<WritingCompositionGenerationRecordVO>> pageGenerationHistory(
            @Valid @RequestBody WritingCompositionGenerationPageQueryDTO dto) {
        return BaseResult.ok(writingCompositionGenerationService.pageMyGenerationHistory(dto));
    }

    @PostMapping("/evaluation/history/page")
    @Operation(summary = "分页查询作文评估历史")
    public BaseResult<Page<WritingCompositionEvaluationRecordVO>> pageEvaluationHistory(
            @Valid @RequestBody WritingCompositionEvaluationPageQueryDTO dto) {
        return BaseResult.ok(writingCompositionEvaluationService.pageMyEvaluationHistory(dto));
    }
}
