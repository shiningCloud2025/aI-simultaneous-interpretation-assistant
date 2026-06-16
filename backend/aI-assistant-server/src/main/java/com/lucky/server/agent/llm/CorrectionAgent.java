package com.lucky.server.agent.llm;

import io.agentscope.core.agent.Agent;
import io.agentscope.core.agent.RuntimeContext;
import io.agentscope.core.event.AgentEvent;
import io.agentscope.core.event.AgentEventType;
import io.agentscope.core.event.TextBlockDeltaEvent;
import io.agentscope.core.event.ToolCallStartEvent;
import io.agentscope.core.formatter.dashscope.DashScopeChatFormatter;
import io.agentscope.core.message.Msg;
import io.agentscope.core.message.UserMessage;
import io.agentscope.core.model.DashScopeChatModel;
import io.agentscope.harness.agent.HarnessAgent;
import io.agentscope.harness.agent.memory.compaction.CompactionConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.nio.file.Paths;

/**
 * @author shiningCloud2025
 */
@Slf4j
@Component
public class CorrectionAgent {
    public void correctionPartTaskForTranslate(){
        HarnessAgent correctionAgent = HarnessAgent.builder()
                .name("部分语句纠错Agent")
                .sysPrompt("你是一个语句纠错助手,每五句纠错一次")
                .model(DashScopeChatModel.builder()
                        .apiKey("换成你自已的APIKEY,如果想换厂商记得把DashScopeChatModel也换了")
                        .modelName("qwen-max")
                        .stream(true)
                        .formatter(new DashScopeChatFormatter())
                        .build())
                .workspace(Paths.get(".agentscope/workspace"))
                .compaction(CompactionConfig.builder()
                        .triggerMessages(30) // 对话累积到 30 条消息时触发压缩
                        .keepMessages(10) // 压缩后保留最近 10 条完整消息，前面 20 条被 LLM 总结成一段摘要
                        .build()
                )
                .build();
        RuntimeContext ctx = RuntimeContext.builder()
                .sessionId("test")
                .userId("shiningCloud2025")
                .build();

        // 第一轮：自我介绍 + 当天的事
        Msg msg1 = correctionAgent.call(new UserMessage("我叫shiningCloud2025,今天准备做一个AI同声转译助手"), ctx).block();

        System.out.println(msg1);

        // 第二轮：同 sessionId，自动恢复上一轮状态后回答
        Msg msg2= correctionAgent.call(new UserMessage("我是谁,我今天想干什么"),ctx).block();


        System.out.println(msg2);
    }

    public void correctionPartTaskForTranslateByStream(){
        HarnessAgent correctionStreamAgent = HarnessAgent.builder()
                .name("部分语句纠错Agent")
                .sysPrompt("你是一个语句纠错助手,每五句纠错一次")
                .model(DashScopeChatModel.builder()
                        .apiKey("换成你自已的APIKEY,如果想换厂商记得把DashScopeChatModel也换了")
                        .modelName("qwen-max")
                        .stream(true)
                        .formatter(new DashScopeChatFormatter())
                        .build())
                .workspace(Paths.get(".agentscope/workspace"))
                .compaction(CompactionConfig.builder()
                        .triggerMessages(30) // 对话累积到 30 条消息时触发压缩
                        .keepMessages(10) // 压缩后保留最近 10 条完整消息，前面 20 条被 LLM 总结成一段摘要
                        .build()
                )
                .build();

        RuntimeContext ctx = RuntimeContext.builder()
                .sessionId("test")
                .userId("shiningCloud2025")
                .build();

       correctionStreamAgent.streamEvents(new UserMessage("我叫shiningCloud2025,今天准备做一个AI同声转译助手"),ctx)
               .doOnNext(event ->{
                   if (event.getType() == AgentEventType.TEXT_BLOCK_DELTA){
                       // 模型返回的流式文本片段 —— 追加到界面或标准输出
                       System.out.println(((TextBlockDeltaEvent)event).getDelta());
                   }else if(event.getType() == AgentEventType.TOOL_CALL_START){
                       // 智能体即将调用工具 —— 展示调用信息
                       System.out.println("\n[tool] " + ((ToolCallStartEvent) event).getToolCallName());
                   }
               })
               .blockLast();
    }


    static void main() {
        new CorrectionAgent().correctionPartTaskForTranslate();
    }
}
