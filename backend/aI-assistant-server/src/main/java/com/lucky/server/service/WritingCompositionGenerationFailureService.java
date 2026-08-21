package com.lucky.server.service;

import com.lucky.server.domain.entity.WritingCompositionGenerationFailure;

/**
 * 写作作文生成失败记录服务接口
 * @author shiningCloud2025
 */
public interface WritingCompositionGenerationFailureService {

    /**
     * 保存生成失败记录
     *
     * @param entity 失败记录
     * @return 失败记录ID
     */
    Long saveFailure(WritingCompositionGenerationFailure entity);
}
