package com.lucky.server.agent.middleware;

import io.agentscope.core.agent.Agent;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.event.AgentEvent;
import io.agentscope.core.middleware.MiddlewareBase;
import io.agentscope.core.middleware.ModelCallInput;
import java.util.function.Function;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;

/**
 * 计时 middleware:下面的 middleware 记录每次模型调用的耗时：
 * @author shiningCloud2025
 */
@Slf4j
public class TimingMiddleware implements MiddlewareBase {
    @Override
    public Flux<AgentEvent> onModelCall(
            Agent agent, RuntimeContext ctx, ModelCallInput input, Function<ModelCallInput, Flux<AgentEvent>> next) {
        long start = System.nanoTime();
        return next.apply(input)
                .doFinally(sig -> {
                    long ms = (System.nanoTime() - start) / 1_000_000;
//                    System.out.println(
//                            "[timing] " + agent.getName() + ": " + ms + "ms");
                    log.info( "[timing] " + agent.getName() + ": " + ms + "ms");
                });
    }
}