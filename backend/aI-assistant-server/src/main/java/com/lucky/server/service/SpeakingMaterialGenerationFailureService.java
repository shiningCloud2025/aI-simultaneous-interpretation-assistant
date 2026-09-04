package com.lucky.server.service;

import com.lucky.server.domain.entity.SpeakingMaterialGenerationFailure;

/**
 * 口语素材生成失败记录服务接口
 * @author shiningCloud2025
 */
public interface SpeakingMaterialGenerationFailureService {

    /**
     * 保存口语素材生成失败记录
     *
     * @param entity 失败记录
     * @return 失败记录ID
     */
    Long saveFailure(SpeakingMaterialGenerationFailure entity);
}
