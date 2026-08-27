package com.lucky.server.service;

/**
 * 阅读单词图片生成服务
 * @author shiningCloud2025
 */
public interface ReadingWordImageGenerateService {

    /**
     * 生成单词配图并上传 COS
     *
     * @param imagePrompt 图片生成提示词
     * @return COS 图片 URL
     */
    String generateAndUpload(String imagePrompt);
}