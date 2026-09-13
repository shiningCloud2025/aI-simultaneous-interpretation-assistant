package com.lucky.server.service;

import com.lucky.server.domain.entity.SpeakingEvaluationRecord;

/**
 * 口语跟读评测记录服务接口
 * @author shiningCloud2025
 */
public interface SpeakingEvaluationRecordService {

    /**
     * 保存口语跟读评测记录
     * @param entity 口语跟读评测记录
     * @return 记录ID
     */
    Long saveRecord(SpeakingEvaluationRecord entity);
}
