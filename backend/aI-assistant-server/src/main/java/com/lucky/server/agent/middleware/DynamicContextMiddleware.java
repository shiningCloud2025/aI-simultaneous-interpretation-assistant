package com.lucky.server.agent.middleware;

import io.agentscope.core.agent.Agent;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.middleware.MiddlewareBase;
import java.time.Instant;
import java.util.function.Supplier;
import reactor.core.publisher.Mono;
/**
 * 动态 system prompt middleware:下面的 middleware 在 system prompt 中注入实时上下文。
 * @author shiningCloud2025
 */
public class DynamicContextMiddleware implements MiddlewareBase {

    private final Supplier<String> contextFn;

    public DynamicContextMiddleware(Supplier<String> contextFn) {
        this.contextFn = contextFn;
    }

    @Override
    public Mono<String> onSystemPrompt(Agent agent, RuntimeContext ctx, String currentPrompt) {
        return Mono.just(currentPrompt + "\n\n## Current Context\n" + contextFn.get());
    }
}

// 装配：
// .middlewares(List.of(new DynamicContextMiddleware(() -> "Time: " + Instant.now())))