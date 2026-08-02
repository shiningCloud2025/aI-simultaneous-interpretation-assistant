package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.SysUserLoginDTO;
import com.lucky.server.domain.dto.SysUserRegisterDTO;
import com.lucky.server.domain.dto.SysUserResetPasswordDTO;
import com.lucky.server.domain.dto.SysUserUpdateDTO;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.SysUserLoginTokenVO;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 系统用户 Service接口
 * @author shiningCloud2025
 */
public interface SysUserService  extends IService<SysUser> {
    /**
     * 登录
     * @param dto     登录请求
     * @param request HTTP请求
     * @return JWT Token
     */
    SysUserLoginTokenVO login(SysUserLoginDTO dto, HttpServletRequest request);


    /**
     * 用户注册（注册即登录，返回Token）
     *
     * @param dto     注册信息
     * @param request HTTP 请求（用于获取 IP）
     * @return Token
     */
    SysUserLoginTokenVO register(SysUserRegisterDTO dto, HttpServletRequest request);


    /**
     * 修改个人资料
     *
     * @param dto 修改信息
     */
    void updateProfile(SysUserUpdateDTO dto);

    /**
     * 忘记密码（通过手机/邮箱验证码重置）
     *
     * @param dto 重置信息
     */
    void resetPassword(SysUserResetPasswordDTO dto);



    /**
     * 获取当前登录用户信息
     *
     * @return 用户实体
     */
    SysUser getCurrentUser();


    /**
     * 生成不重复的随机账号（5-12位数字）
     * @return 随机账号
     */
    String generateRandomAccount();
}
