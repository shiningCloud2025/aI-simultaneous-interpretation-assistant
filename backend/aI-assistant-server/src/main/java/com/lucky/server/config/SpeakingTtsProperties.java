package com.lucky.server.config;

import com.lucky.server.common.enums.SpeakingTtsVoiceEnum;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 口语标准音频 TTS 配置
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties(prefix = "speaking.tts")
public class SpeakingTtsProperties {

    /** 厂商标识 */
    private String provider = "alibaba";

    /** TTS模型 */
    private String modelName = "qwen-audio-3.0-tts-flash";

    /** TTS WebSocket 地址 */
    private String websocketUrl;

    /** TTS API Key */
    private String apiKey;

    /** 默认TTS音色 */
    private SpeakingTtsVoiceEnum defaultVoice = SpeakingTtsVoiceEnum.LOONG_EVA;

    /** 音频文件后缀 */
    private String fileExtension = "mp3";

    /** 音频 MIME 类型 */
    private String contentType = "audio/mpeg";
}