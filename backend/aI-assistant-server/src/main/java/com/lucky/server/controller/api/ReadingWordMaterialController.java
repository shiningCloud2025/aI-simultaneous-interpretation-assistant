package com.lucky.server.controller.api;

import com.lucky.server.agent.read.ReadingWordMaterialGenerateAgent;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.ReadingWordMaterialGenerateDTO;
import com.lucky.server.domain.vo.ReadingWordMaterialGenerateResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * 阅读单词素材控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("reading/word/material")
@RequiredArgsConstructor
@Tag(name = "ReadingWordMaterialController", description = "阅读单词素材")
public class ReadingWordMaterialController {

    private final ReadingWordMaterialGenerateAgent readingWordMaterialGenerateAgent;

    @PostMapping("/generate")
    @Operation(summary = "生成阅读单词素材")
    public Mono<BaseResult<ReadingWordMaterialGenerateResultVO>> generate(
            @Valid @RequestBody ReadingWordMaterialGenerateDTO dto) {
        return readingWordMaterialGenerateAgent.generate(dto)
                .map(BaseResult::ok);
    }
}