package com.lucky.server.handler;

import com.lucky.server.common.jwt.JwtUtil;
import com.lucky.server.service.AuthTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * WebSocket 握手鉴权拦截器
 * 在握手阶段解析 JWT，把 userId / direction 塞进 session 属性，供后续消息处理使用
 *
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuthHandshakeInterceptor implements HandshakeInterceptor {
    /** 存进 session attributes 的 key */
    public static final String ATTR_USER_ID = "userId";
    public static final String ATTR_DIRECTION = "direction";

    private final JwtUtil jwtUtil;
    private final AuthTokenService authTokenService;

    /**
     * 握手前：解析 token 并鉴权
     *
     * @param request    握手请求（本质是个 HTTP 升级请求）
     * @param response   握手响应
     * @param wsHandler  WebSocket 处理器
     * @param attributes 会话属性 Map，这里塞进去的值后续可通过 session.getAttributes() 读取
     * @return true 允许握手；false 拒绝握手
     */
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        // 1. 取 token：Header 的 Authorization 优先，URL 参数 token 兜底
        String token = extractToken(request);
        if (!StringUtils.hasText(token) || !jwtUtil.validateToken(token)) {
            log.warn("WebSocket 握手被拒绝：token 缺失或无效, uri={}", request.getURI());
            return false;
        }

        // 2. 解析 userId
        Long userId = jwtUtil.getUserId(token);

        // 3. 取翻译方向（URL 参数，例如 zh-en）
        String direction = getQueryParam(request, "direction");
        if (!StringUtils.hasText(direction)) {
            direction = "zh-en"; // 默认中译英
        }

        String tokenId = jwtUtil.getTokenId(token);
        if (!authTokenService.validateToken(userId, tokenId)) {
            log.warn("WebSocket 握手被拒绝：token 已失效, userId={}, uri={}", userId, request.getURI());
            return false;
        }
        authTokenService.refreshToken(userId);


        // 4. 塞进 session attributes，之后消息处理时通过 session.getAttributes() 读取
        attributes.put(ATTR_USER_ID, userId);
        attributes.put(ATTR_DIRECTION, direction);

        log.info("WebSocket 握手成功: userId={}, direction={}", userId, direction);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // 握手后无需处理
    }

    /**
     * 提取 token：优先从 Authorization 头，其次从 URL 参数
     *
     * @param request 握手请求
     * @return token 字符串，取不到返回 null
     */
    private String extractToken(ServerHttpRequest request) {
        // 1. Authorization: Bearer xxx
        String header = request.getHeaders().getFirst("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        // 2. URL 参数 ?token=xxx
        return getQueryParam(request, "token");
    }

    /**
     * 从 URL 查询参数里取值
     *
     * @param request 握手请求
     * @param name    参数名
     * @return 参数值，取不到返回 null
     */
    private String getQueryParam(ServerHttpRequest request, String name) {
        return UriComponentsBuilder.fromUri(request.getURI())
                .build()
                .getQueryParams()
                .getFirst(name);
    }
}
