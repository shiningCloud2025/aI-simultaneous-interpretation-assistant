package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.SysUserLoginDTO;
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
}
