package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SysUserLoginDTO;
import com.lucky.server.domain.vo.SysUserLoginTokenVO;
import com.lucky.server.service.SysUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 系统用户控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/sys/user")
@RequiredArgsConstructor
@Tag(name="SysUserController",description = "系统用户控制器")
public class SysUserController {
    private final SysUserService sysUserService;

    @PostMapping("/login")
    @Operation(summary = "系统用户登录")
    public BaseResult<SysUserLoginTokenVO> login(@Valid @RequestBody SysUserLoginDTO dto,HttpServletRequest request){
        return BaseResult.ok(sysUserService.login(dto, request));
    }
}
