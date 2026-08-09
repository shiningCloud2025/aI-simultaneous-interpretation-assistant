package com.lucky.server.agent.listen;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.function.Consumer;

/**
 * @author shiningCloud2025
 */
@Slf4j
@Component
public class TranslateAgent {


    /**
     * 实时翻译
     * @param sessionId  会话ID（同一用户多次翻译用不同sessionId区分）
     * @param sourceText ASR识别的最新原文
     * @param onToken    译文token回调（每个token推送给前端，实现打字机效果）
     */
    public void translate(String sessionId, String sourceText, Consumer<String> onToken){

    }
}
