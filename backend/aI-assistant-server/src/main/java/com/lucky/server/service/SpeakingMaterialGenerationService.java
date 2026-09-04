package com.lucky.server.service;

import com.lucky.server.domain.entity.SpeakingMaterialGeneration;

/**
 * 口语素材生成记录服务接口
 * @author shiningCloud2025
 */
public interface SpeakingMaterialGenerationService {

    /**
     * 保存口语素材生成记录
     *
     * @param entity 口语素材生成记录
     * @return 口语素材生成记录ID
     */
    Long saveGeneration(SpeakingMaterialGeneration entity);
}
