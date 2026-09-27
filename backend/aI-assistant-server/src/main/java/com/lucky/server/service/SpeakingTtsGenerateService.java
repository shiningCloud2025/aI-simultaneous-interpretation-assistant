package com.lucky.server.service;

import com.lucky.server.common.enums.SpeakingTtsVoiceEnum;

import java.math.BigDecimal;

/**
 * 口语标准音频生成服务接口
 * @author shiningCloud2025
 */
public interface SpeakingTtsGenerateService {

    /**
     * 生成标准跟读音频并上传 COS
     *
     * @param text TTS合成文本
     * @param voice TTS音色
     * @param speechRate TTS语速（0.5~2.0）
     * @return 标准跟读音频URL
     */
    String generateAndUpload(String text, SpeakingTtsVoiceEnum voice, BigDecimal speechRate);
}
