package com.lucky.server.common.jwt;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * JWT用户信息
 * @author shiningCloud2025
 */
@Data
@AllArgsConstructor
public class JwtUserInfo {
    private Long userId;
    private String account;
    private String username;
}
