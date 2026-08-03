package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.FeedbackPageQueryDTO;
import com.lucky.server.domain.dto.SysUserFeedbackSubmitDTO;
import com.lucky.server.domain.vo.SysUserFeedbackDetailVO;
import com.lucky.server.domain.vo.SysUserFeedbackVO;
import com.lucky.server.service.SysUserFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 用户反馈控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/sys/user/feedback")
@RequiredArgsConstructor
@Tag(name = "SysUserFeedbackController", description = "用户反馈")
public class SysUserFeedbackController {

    private final SysUserFeedbackService sysUserFeedbackService;

    @PostMapping("/submit")
    @Operation(summary = "提交反馈")
    public BaseResult<Void> submit(@Valid @RequestBody SysUserFeedbackSubmitDTO dto) {
        sysUserFeedbackService.submit(dto);
        return BaseResult.ok();
    }

    @PostMapping("/page")
    @Operation(summary = "我的反馈列表")
    public BaseResult<Page<SysUserFeedbackVO>> page(@Valid @RequestBody FeedbackPageQueryDTO dto) {
        return BaseResult.ok(sysUserFeedbackService.pageMyFeedback(dto));
    }

    @GetMapping("/{id}")
    @Operation(summary = "反馈详情")
    public BaseResult<SysUserFeedbackDetailVO> detail(@PathVariable Long id) {
        return BaseResult.ok(sysUserFeedbackService.detail(id));
    }
}
