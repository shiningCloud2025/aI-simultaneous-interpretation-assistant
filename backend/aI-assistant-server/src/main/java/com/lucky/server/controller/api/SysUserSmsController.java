package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.service.SysUserSmsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 系统用户短信控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/sys/user/sms")
@RequiredArgsConstructor
@Tag(name = "SysUserSmsController", description = "系统用户短信控制器")
public class SysUserSmsController {

    private final SysUserSmsService sysUserSmsService;

    @PostMapping("/send")
    @Operation(summary = "发送短信验证码")
    public BaseResult<Void> sendVerifyCode(@RequestParam String phone) {
        sysUserSmsService.sendVerifyCode(phone);
        return BaseResult.ok();
    }
}
