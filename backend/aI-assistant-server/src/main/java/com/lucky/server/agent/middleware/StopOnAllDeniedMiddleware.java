package com.lucky.server.agent.middleware;

import io.agentscope.core.agent.Agent;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.event.AgentEvent;
import io.agentscope.core.event.AllToolsDeniedEvent;
import io.agentscope.core.event.RequestStopEvent;
import io.agentscope.core.message.GenerateReason;
import io.agentscope.core.middleware.ActingInput;
import io.agentscope.core.middleware.MiddlewareBase;
import java.util.function.Function;
import reactor.core.publisher.Flux;
/**
 * 全部工具被拒绝时停止 agent:当用户通过 HITL 拒绝了一轮推理产出的全部工具调用时，agent 默认会继续下一轮推理
 * （向后兼容）。如果希望在这种场景下停止 agent，可以编写一个 onActing middleware
 * 观察 AllToolsDeniedEvent 并发出 RequestStopEvent
 * @author shiningCloud2025
 */
public class StopOnAllDeniedMiddleware implements MiddlewareBase {

    @Override
    public Flux<AgentEvent> onActing(
            Agent agent, RuntimeContext ctx, ActingInput input,
            Function<ActingInput, Flux<AgentEvent>> next) {
        return next.apply(input)
                .flatMap(event -> {
                    if (event instanceof AllToolsDeniedEvent) {
                        return Flux.just(
                                event,
                                new RequestStopEvent(
                                        "All tools denied by user",
                                        GenerateReason.ALL_TOOLS_DENIED));
                    }
                    return Flux.just(event);
                });
    }
}