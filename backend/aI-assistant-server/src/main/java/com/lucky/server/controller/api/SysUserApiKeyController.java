package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SysUserApiKeyDTO;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.vo.SysUserApiKeyVO;
import com.lucky.server.service.SysUserApiKeyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系统用户API Key控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/user/api-key")
@RequiredArgsConstructor
@Tag(name = "SysUserApiKeyController", description = "系统用户API Key控制器")
public class SysUserApiKeyController {

    private final SysUserApiKeyService sysUserApiKeyService;

    @PostMapping
    @Operation(summary = "配置API Key")
    public BaseResult<Void> save(@Valid @RequestBody SysUserApiKeyDTO dto) {
        sysUserApiKeyService.saveApiKey(dto);
        return BaseResult.ok();
    }

    @GetMapping
    @Operation(summary = "查看我的API Key列表")
    public BaseResult<List<SysUserApiKeyVO>> list() {
        return BaseResult.ok(sysUserApiKeyService.listApiKeys());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除API Key")
    public BaseResult<Void> delete(@PathVariable Long id) {
        sysUserApiKeyService.deleteApiKey(id);
        return BaseResult.ok();
    }

    @PostMapping("/{id}/test")
    @Operation(summary = "测试API Key连通性")
    public BaseResult<Void> test(@PathVariable Long id) {
        sysUserApiKeyService.testApiKey(id);
        return BaseResult.ok();
    }
}
