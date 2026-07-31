package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SysUserShortcutConfigSaveDTO;
import com.lucky.server.domain.vo.SysUserShortcutConfigVO;
import com.lucky.server.service.SysUserShortcutConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系统用户快捷键配置控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/user/shortcut/config")
@RequiredArgsConstructor
@Tag(name = "SysUserShortcutConfigController", description = "系统用户快捷键配置控制器")
public class SysUserShortcutConfigController {

    private final SysUserShortcutConfigService shortcutConfigService;

    @GetMapping
    @Operation(summary = "获取当前用户快捷键配置")
    public BaseResult<List<SysUserShortcutConfigVO>> list() {
        return BaseResult.ok(shortcutConfigService.listByUserId());
    }

    @PutMapping
    @Operation(summary = "批量保存快捷键配置")
    public BaseResult<Void> save(@Valid @RequestBody SysUserShortcutConfigSaveDTO dto) {
        shortcutConfigService.batchSaveOrUpdate(dto.shortcuts());
        return BaseResult.ok();
    }
}
