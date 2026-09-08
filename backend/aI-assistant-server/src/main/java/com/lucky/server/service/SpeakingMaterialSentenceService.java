package com.lucky.server.service;

import com.lucky.server.domain.entity.SpeakingMaterialSentence;

/**
 * 口语素材句子明细服务接口
 * @author shiningCloud2025
 */
public interface SpeakingMaterialSentenceService {

    /**
     * 保存口语素材句子明细
     *
     * @param entity 口语素材句子明细
     * @return 口语素材句子明细ID
     */
    Long saveSentence(SpeakingMaterialSentence entity);

    /**
     * 根据ID查询口语素材句子明细
     *
     * @param id 口语素材句子明细ID
     * @return 口语素材句子明细
     */
    SpeakingMaterialSentence getSentenceById(Long id);
}
