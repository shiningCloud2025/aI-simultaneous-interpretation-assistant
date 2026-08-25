package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.domain.dto.WritingCompositionEvaluationPageQueryDTO;
import com.lucky.server.domain.entity.WritingCompositionEvaluation;
import com.lucky.server.domain.vo.WritingCompositionEvaluationRecordVO;

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

    /**
     * 分页查询当前用户作文评估历史
     *
     * @param dto 查询参数
     * @return 作文评估历史分页
     */
    Page<WritingCompositionEvaluationRecordVO> pageMyEvaluationHistory(WritingCompositionEvaluationPageQueryDTO dto);
}
