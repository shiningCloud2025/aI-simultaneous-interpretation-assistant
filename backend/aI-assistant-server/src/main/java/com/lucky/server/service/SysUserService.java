package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.SysUserLoginDTO;
import com.lucky.server.domain.dto.SysUserRegisterDTO;
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
     * 生成不重复的随机账号（5-12位数字）
     * @return 随机账号
     */
    String generateRandomAccount();
}
