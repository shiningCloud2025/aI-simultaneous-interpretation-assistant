package com.lucky.server.service.impl;

import com.lucky.server.common.constant.RedisKeyConstant;
import com.lucky.server.common.util.RedisCacheUtil;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.service.AuthTokenService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 登录 token 管理服务实现
 *
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class AuthTokenServiceImpl implements AuthTokenService {

    private final RedisCacheUtil redisCacheUtil;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    @Override
    public String saveLoginToken(SysUser user, HttpServletRequest request) {
        String tokenId = UUID.randomUUID().toString();

        redisCacheUtil.set(
                RedisKeyConstant.authUserTokenKey(user.getId()),
                tokenId,
                jwtExpiration,
                TimeUnit.MILLISECONDS
        );

        return tokenId;
    }

    @Override
    public boolean validateToken(Long userId, String tokenId) {
        if (userId == null || tokenId == null || tokenId.isBlank()) {
            return false;
        }

        Object currentTokenId = redisCacheUtil.get(RedisKeyConstant.authUserTokenKey(userId));
        return tokenId.equals(String.valueOf(currentTokenId));
    }

    @Override
    public void refreshToken(Long userId) {
        if (userId == null) {
            return;
        }

        redisCacheUtil.expire(
                RedisKeyConstant.authUserTokenKey(userId),
                jwtExpiration,
                TimeUnit.MILLISECONDS
        );
    }

    @Override
    public void kickOut(Long userId) {
        if (userId == null) {
            return;
        }

        redisCacheUtil.delete(RedisKeyConstant.authUserTokenKey(userId));
    }

    @Override
    public List<Long> listOnlineUserIds() {
        return redisCacheUtil.keys(RedisKeyConstant.AUTH_USER_TOKEN_PREFIX + "*")
                .stream()
                .map(key -> key.substring(RedisKeyConstant.AUTH_USER_TOKEN_PREFIX.length()))
                .map(this::parseLongSafely)
                .filter(Objects::nonNull)
                .toList();
    }

    private Long parseLongSafely(String value) {
        try {
            return Long.valueOf(value);
        } catch (Exception e) {
            return null;
        }
    }
}