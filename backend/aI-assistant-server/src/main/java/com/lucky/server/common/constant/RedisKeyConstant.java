package com.lucky.server.common.constant;

/**
 * Redis Key 常量
 *
 * @author shiningCloud2025
 */
public class RedisKeyConstant {

    private RedisKeyConstant() {}

    /**
     * 当前用户唯一有效 tokenId。
     * key: auth:user:token:{userId}
     */
    public static final String AUTH_USER_TOKEN_PREFIX = "auth:user:token:";

    public static String authUserTokenKey(Long userId) {
        return AUTH_USER_TOKEN_PREFIX + userId;
    }
}