package com.lucky.server.common.tester;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * ASR API Key 连通性测试器
 * @author shiningCloud2025
 */
@Slf4j
@Component
public class AsrApiKeyTester {

    /**
     * 测试 ASR API Key 是否可用
     * TODO: 接入 DashScope 语音接口实际测试
     */
    public boolean test(String apiKey) {
        // ASR 需要 WebSocket 连接测试，暂时直接标可用
        log.info("ASR Key 测试（暂未实现真实测试）");
        return true;
    }
}
