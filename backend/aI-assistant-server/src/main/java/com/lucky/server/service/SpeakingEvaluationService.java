package com.lucky.server.service;

import com.lucky.server.domain.dto.SpeakingEvaluationDTO;
import com.lucky.server.domain.vo.SpeakingEvaluationResultVO;

/**
 * 口语跟读评测服务接口
 * @author shiningCloud2025
 */
public interface SpeakingEvaluationService {

    /**
     * 评测学生跟读音频
     * @param dto 口语跟读评测请求
     * @return 口语跟读评测结果
     */
    SpeakingEvaluationResultVO evaluate(SpeakingEvaluationDTO dto);
}