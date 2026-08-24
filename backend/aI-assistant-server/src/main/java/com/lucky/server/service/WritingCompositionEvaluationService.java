package com.lucky.server.service;

import com.lucky.server.domain.entity.WritingCompositionEvaluation;

/**
 * 写作作文评估记录服务接口
 * @author shiningCloud2025
 */
public interface WritingCompositionEvaluationService {

    /**
     * 保存评估成功记录
     *
     * @param entity 评估记录
     * @return 评估记录ID
     */
    Long saveEvaluation(WritingCompositionEvaluation entity);
}
