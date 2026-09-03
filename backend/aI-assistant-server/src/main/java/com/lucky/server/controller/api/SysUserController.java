package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.*;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.SysUserInfoVO;
import com.lucky.server.domain.vo.SysUserLoginTokenVO;
import com.lucky.server.service.SysUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 系统用户控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("sys/user")
@RequiredArgsConstructor
@Tag(name="SysUserController",description = "系统用户控制器")
public class SysUserController {
    private final SysUserService sysUserService;

    @PostMapping("/student/login")
    @Operation(summary = "学生登录")
    public BaseResult<SysUserLoginTokenVO> studentLogin(@Valid @RequestBody SysUserStudentLoginDTO dto,
                                                        HttpServletRequest request){
        return BaseResult.ok(sysUserService.studentLogin(dto, request));
    }

    @PostMapping("/student/register")
    @Operation(summary = "学生注册")
    public BaseResult<SysUserLoginTokenVO> studentRegister(@Valid @RequestBody SysUserStudentRegisterDTO dto,
                                                           HttpServletRequest request) {
        return BaseResult.ok(sysUserService.studentRegister(dto, request));
    }

    /**
     * 老师登录
     * <p>用户类型固定为 TEACHER，前端无法指定。
     */
    @PostMapping("/teacher/login")
    @Operation(summary = "老师登录")
    public BaseResult<SysUserLoginTokenVO> teacherLogin(@Valid @RequestBody SysUserTeacherLoginDTO dto,
                                                        HttpServletRequest request){
        return BaseResult.ok(sysUserService.teacherLogin(dto, request));
    }

    /**
     * 老师注册
     * <p>用户类型固定为 TEACHER，注册即登录。
     */
    @PostMapping("/teacher/register")
    @Operation(summary = "老师注册")
    public BaseResult<SysUserLoginTokenVO> teacherRegister(@Valid @RequestBody SysUserTeacherRegisterDTO dto,
                                                           HttpServletRequest request) {
        return BaseResult.ok(sysUserService.teacherRegister(dto, request));
    }


    @PutMapping("/profile")
    @Operation(summary = "修改个人资料")
    public BaseResult<Void> updateProfile(@Valid @RequestBody SysUserUpdateDTO dto) {
        sysUserService.updateProfile(dto);
        return BaseResult.ok();
    }


    @PutMapping("/reset-password")
    @Operation(summary = "忘记密码")
    public BaseResult<Void> resetPassword(@Valid @RequestBody SysUserResetPasswordDTO dto) {
        sysUserService.resetPassword(dto);
        return BaseResult.ok();
    }


    @GetMapping("/info")
    @Operation(summary = "获取当前登录用户信息")
    public BaseResult<SysUserInfoVO> info() {
        return BaseResult.ok(SysUserInfoVO.from(sysUserService.getCurrentUser()));
    }

}
