package com.lucky.server.asr;

import lombok.Builder;
import lombok.Data;

/**
 * ASR配置
 * @author shiningCloud2025
 */
@Data
@Builder
public class AsrConfig {

    /** API Key */
    private String apiKey;
    /** 模型名，默认 fun-asr-realtime */
    @Builder.Default
    private String model = "fun-asr-realtime";
    /** 语言：ko/ja/en/zh，null=自动 */
    private String language;
    /** 音频格式，默认 pcm */
    @Builder.Default
    private String format = "pcm";
    /** 采样率，默认 16000 */
    @Builder.Default
    private int sampleRate = 16000;
    /** WebSocket 地址，不同地域不同 */
    @Builder.Default
    private String wsUrl = "wss://dashscope.aliyuncs.com/api-ws/v1/inference";
}
