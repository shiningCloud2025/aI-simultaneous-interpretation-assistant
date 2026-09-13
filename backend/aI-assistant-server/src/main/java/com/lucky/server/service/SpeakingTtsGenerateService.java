package com.lucky.server.service;

/**
 * 口语标准音频生成服务接口
 * @author shiningCloud2025
 */
public interface SpeakingTtsGenerateService {

    /**
     * 生成标准跟读音频并上传 COS
     *
     * @param text TTS合成文本
     * @return 标准跟读音频URL
     */
    String generateAndUpload(String text);
}