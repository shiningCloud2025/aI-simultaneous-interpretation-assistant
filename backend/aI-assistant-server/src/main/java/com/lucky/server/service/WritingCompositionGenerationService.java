package com.lucky.server.service;

import com.lucky.server.domain.entity.WritingCompositionGeneration;

/**
 * 写作作文生成记录服务接口
 * @author shiningCloud2025
 */
public interface WritingCompositionGenerationService {

    /**
     * 保存生成成功记录
     *
     * @param entity 生成记录
     * @return 生成记录ID
     */
    Long saveGeneration(WritingCompositionGeneration entity);

    /**
     * 查询正常生成记录
     *
     * @param id 主键ID
     * @return 生成记录
     */
    WritingCompositionGeneration getNormalById(Long id);
}
