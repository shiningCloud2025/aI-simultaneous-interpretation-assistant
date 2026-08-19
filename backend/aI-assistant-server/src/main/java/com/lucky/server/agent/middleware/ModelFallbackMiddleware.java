package com.lucky.server.agent.middleware;

import io.agentscope.core.agent.Agent;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.event.AgentEvent;
import io.agentscope.core.middleware.MiddlewareBase;
import io.agentscope.core.middleware.ModelCallInput;
import io.agentscope.core.model.Model;
import java.util.function.Function;
import reactor.core.publisher.Flux;
/**
 * 模型回退 middleware:下面的 middleware 在主模型失败时切换到备用模型
 * @author shiningCloud2025
 */
public class ModelFallbackMiddleware implements MiddlewareBase {

    private final Model fallback;

    public ModelFallbackMiddleware(Model fallback) {
        this.fallback = fallback;
    }

    @Override
    public Flux<AgentEvent> onModelCall(
            Agent agent, RuntimeContext ctx, ModelCallInput input, Function<ModelCallInput, Flux<AgentEvent>> next) {
        return next.apply(input)
                .onErrorResume(err -> {
                    System.err.println("Primary model failed: " + err.getMessage()
                            + ", switching to fallback");
                    return next.apply(
                            new ModelCallInput(
                                    input.messages(),
                                    input.tools(),
                                    input.options(),
                                    fallback));
                });
    }
}