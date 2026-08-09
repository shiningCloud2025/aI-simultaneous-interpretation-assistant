package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.service.SysUserEmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 系统用户邮箱控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("sys/user/email")
@RequiredArgsConstructor
@Tag(name = "SysUserEmailController", description = "系统用户邮箱控制器")
public class SysUserEmailController {

    private final SysUserEmailService sysUserEmailService;

    @PostMapping("/send")
    @Operation(summary = "发送邮箱验证码")
    public BaseResult<Void> sendVerifyCode(@RequestParam String email) {
        sysUserEmailService.sendVerifyCode(email);
        return BaseResult.ok();
    }
}
