package com.lucky.server.service;

import com.lucky.server.domain.entity.SysUser;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

/**
 * 登录 token 管理服务
 *
 * @author shiningCloud2025
 */
public interface AuthTokenService {

    /**
     * 登录成功后写入当前用户唯一有效 tokenId
     *
     * @param user    当前登录用户
     * @param request HTTP 请求
     * @return tokenId
     */
    String saveLoginToken(SysUser user, HttpServletRequest request);

    /**
     * 校验当前 tokenId 是否仍是该用户唯一有效 tokenId
     *
     * @param userId  用户ID
     * @param tokenId JWT 中的 tokenId
     * @return true=有效，false=无效
     */
    boolean validateToken(Long userId, String tokenId);

    /**
     * 刷新 token 过期时间
     *
     * @param userId 用户ID
     */
    void refreshToken(Long userId);

    /**
     * 踢出用户
     *
     * @param userId 用户ID
     */
    void kickOut(Long userId);

    /**
     * 查询当前在线用户ID列表
     *
     * @return 在线用户ID列表
     */
    List<Long> listOnlineUserIds();
}