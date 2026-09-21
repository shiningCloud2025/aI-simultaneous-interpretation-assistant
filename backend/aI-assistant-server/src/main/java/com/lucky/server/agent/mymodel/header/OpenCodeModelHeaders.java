package com.lucky.server.agent.mymodel.header;

import io.agentscope.core.model.GenerateOptions;
import org.springframework.util.StringUtils;

/**
 * 智语同航 OpenCode 模型请求头构造器。
 *
 * 仅对平台自封装的 OpenCode 厂商追加专属请求头，避免影响普通 OpenAI 兼容厂商。
 */
public final class OpenCodeModelHeaders {

    private static final String USER_AGENT = "zhiyu-coding-agent/1.0";

    private OpenCodeModelHeaders() {
    }

    public static GenerateOptions build(String provider, String sessionId) {
        if (!isOpenCodeProvider(provider) || !StringUtils.hasText(sessionId)) {
            return null;
        }

        return GenerateOptions.builder()
                .additionalHeader("User-Agent", USER_AGENT)
                .additionalHeader("x-opencode-session", sessionId)
                .build();
    }

    /**
     * 在既有生成参数上追加 OpenCode 专属请求头。
     *
     * @param builder   生成参数构造器
     * @param provider  LLM厂商标识
     * @param sessionId OpenCode稳定会话ID
     * @return 原构造器，便于链式设置
     */
    public static GenerateOptions.Builder apply(GenerateOptions.Builder builder, String provider, String sessionId) {
        GenerateOptions.Builder target = builder == null ? GenerateOptions.builder() : builder;
        GenerateOptions options = build(provider, sessionId);
        if (options != null) {
            target.additionalHeaders(options.getAdditionalHeaders());
        }
        return target;
    }

    private static boolean isOpenCodeProvider(String provider) {
        return "opencode".equalsIgnoreCase(provider)
                || "zhiyu-opencode".equalsIgnoreCase(provider)
                || "zhiyutonghang".equalsIgnoreCase(provider)
                || "zhiyu".equalsIgnoreCase(provider)
                || "智语同航".equalsIgnoreCase(provider);
    }

}
