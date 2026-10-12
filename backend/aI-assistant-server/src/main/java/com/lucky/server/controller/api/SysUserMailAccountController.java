package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SysUserMailAccountSaveDTO;
import com.lucky.server.domain.dto.SysUserMailAccountVerifyDTO;
import com.lucky.server.domain.vo.SysUserMailAccountVO;
import com.lucky.server.service.SysUserMailAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系统用户邮箱绑定账号控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("sys/user/mail-account")
@RequiredArgsConstructor
@Tag(name = "SysUserMailAccountController", description = "系统用户邮箱绑定账号控制器")
public class SysUserMailAccountController {

    private final SysUserMailAccountService sysUserMailAccountService;

    @PostMapping
    @Operation(summary = "绑定邮箱账号")
    public BaseResult<Void> save(@Valid @RequestBody SysUserMailAccountSaveDTO dto) {
        sysUserMailAccountService.saveMailAccount(dto);
        return BaseResult.ok();
    }

    @GetMapping
    @Operation(summary = "查看我的邮箱绑定列表")
    public BaseResult<List<SysUserMailAccountVO>> list() {
        return BaseResult.ok(sysUserMailAccountService.listMailAccounts());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除邮箱绑定")
    public BaseResult<Void> delete(@PathVariable Long id) {
        sysUserMailAccountService.deleteMailAccount(id);
        return BaseResult.ok();
    }

    @PostMapping("/{id}/test")
    @Operation(summary = "测试邮箱连接")
    public BaseResult<Void> test(@PathVariable Long id) {
        sysUserMailAccountService.testMailAccount(id);
        return BaseResult.ok();
    }

    @PostMapping("/{id}/verify-access")
    @Operation(summary = "校验邮箱访问密码")
    public BaseResult<Void> verifyAccess(@PathVariable Long id, @Valid @RequestBody SysUserMailAccountVerifyDTO dto) {
        sysUserMailAccountService.verifyAccessPassword(id, dto);
        return BaseResult.ok();
    }
}
