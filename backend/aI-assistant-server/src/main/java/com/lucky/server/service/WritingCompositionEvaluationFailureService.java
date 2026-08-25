package com.lucky.server.service;

import com.lucky.server.domain.entity.WritingCompositionEvaluationFailure;

/**
 * 写作作文评估失败记录服务接口
 * @author shiningCloud2025
 */
public interface WritingCompositionEvaluationFailureService {

    /**
     * 保存评估失败记录
     *
     * @param entity 失败记录
     * @return 失败记录ID
     */
    Long saveFailure(WritingCompositionEvaluationFailure entity);
}
