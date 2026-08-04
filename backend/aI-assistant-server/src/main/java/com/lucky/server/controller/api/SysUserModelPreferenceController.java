package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SysUserModelPreferenceDTO;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.service.SysUserModelPreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系统用户模型偏好控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/user/model-preference")
@RequiredArgsConstructor
@Tag(name = "SysUserModelPreferenceController", description = "系统用户模型偏好控制器")
public class SysUserModelPreferenceController {

    private final SysUserModelPreferenceService preferenceService;

    @PutMapping
    @Operation(summary = "设置默认模型")
    public BaseResult<Void> save(@Valid @RequestBody SysUserModelPreferenceDTO dto) {
        preferenceService.savePreference(dto);
        return BaseResult.ok();
    }

    @GetMapping
    @Operation(summary = "查看我的模型偏好")
    public BaseResult<List<SysUserModelPreferenceVO>> list() {
        return BaseResult.ok(preferenceService.listPreferences());
    }
}
