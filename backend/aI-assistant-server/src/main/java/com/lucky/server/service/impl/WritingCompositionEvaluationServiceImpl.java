package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.entity.WritingCompositionEvaluation;
import com.lucky.server.mapper.WritingCompositionEvaluationMapper;
import com.lucky.server.service.WritingCompositionEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 写作作文评估记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class WritingCompositionEvaluationServiceImpl extends ServiceImpl<WritingCompositionEvaluationMapper, WritingCompositionEvaluation> implements WritingCompositionEvaluationService {

    @Override
    public Long saveEvaluation(WritingCompositionEvaluation entity) {
        LocalDateTime now = LocalDateTime.now();
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        entity.setCreatedById(entity.getUserId());
        entity.setUpdatedById(entity.getUserId());
        entity.setDeleted(DeletedStatusEnum.NORMAL);
        save(entity);
        return entity.getId();
    }
}
