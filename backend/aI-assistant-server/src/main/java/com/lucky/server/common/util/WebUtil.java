package com.lucky.server.common.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

/**
 * Web 相关工具类
 * @author shiningCloud2025
 */
public class WebUtil {
    /**
     * 获取客户端真实 IP，兼容反向代理（Nginx / 网关）。
     * 直接 request.getRemoteAddr() 在代理后会拿到代理机 IP，拿不到用户真实 IP。
     *
     * 代理链路示意:
     *   客户端 → Nginx → 网关 → 应用
     *   应用看到的 remoteAddr 是网关 IP，真实 IP 被放在请求头里一层层透传。
     *
     * X-Forwarded-For 格式: "真实IP, 代理1, 代理2, ..."
     *   取第一个逗号前的内容，就是最原始的客户端 IP。
     *
     * @param request HTTP 请求
     * @return 客户端真实 IP
     */
    public static String getClientIp(HttpServletRequest request) {
        // 优先级: X-Forwarded-For → X-Real-IP → 其他代理头 → 兜底 remoteAddr
        String ip = request.getHeader("X-Forwarded-For");
        if (isInvalid(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (isInvalid(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (isInvalid(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (isInvalid(ip)) {
            ip = request.getRemoteAddr();
        }

        // 辅助理解:
        //   X-Forwarded-For = "203.0.113.1, 10.0.0.1, 10.0.0.2"
        //                        ↑真实IP        ↑代理链路(从左往右追加)
        //   只取第一个逗号前的内容，并去掉两端空白
        if (ip != null && ip.contains(",")) {
            ip = ip.substring(0, ip.indexOf(',')).trim();
        }
        return ip;
    }

    /**
     * 判断 IP 请求头是否无效（为空 或 被代理标记为 unknown 占位）
     * @param ip 请求头中的 IP 字符串
     * @return true=无效，需要继续往下一个头回退
     */
    private static boolean isInvalid(String ip) {
        return !StringUtils.hasText(ip) || "unknown".equalsIgnoreCase(ip);
    }
}
