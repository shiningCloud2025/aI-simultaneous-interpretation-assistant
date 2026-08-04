package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.service.SysUserAiModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * AI模型控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/sys/user/ai")
@RequiredArgsConstructor
@Tag(name = "AiModelController", description = "AI模型控制器")
public class SysUserAiModelController {

    private final SysUserAiModelService sysUserAiModelService;

    @GetMapping("/asr/providers")
    @Operation(summary = "获取ASR厂商列表")
    public BaseResult<?> asrProviders() {
        return BaseResult.ok(sysUserAiModelService.getAsrProviders());
    }

    @GetMapping("/asr/models")
    @Operation(summary = "获取ASR模型列表")
    public BaseResult<?> asrModels(@RequestParam(required = false) String provider) {
        return BaseResult.ok(sysUserAiModelService.getAsrModels(provider));
    }

    @GetMapping("/llm/providers")
    @Operation(summary = "获取LLM厂商列表")
    public BaseResult<?> llmProviders() {
        return BaseResult.ok(sysUserAiModelService.getLlmProviders());
    }

    @GetMapping("/llm/models")
    @Operation(summary = "获取LLM模型列表")
    public BaseResult<?> llmModels(@RequestParam(required = false) String provider) {
        return BaseResult.ok(sysUserAiModelService.getLlmModels(provider));
    }
}
