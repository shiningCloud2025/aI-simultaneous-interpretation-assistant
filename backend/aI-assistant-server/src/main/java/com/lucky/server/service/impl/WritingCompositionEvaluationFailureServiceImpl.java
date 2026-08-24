package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.entity.WritingCompositionEvaluationFailure;
import com.lucky.server.mapper.WritingCompositionEvaluationFailureMapper;
import com.lucky.server.service.WritingCompositionEvaluationFailureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 写作作文评估失败记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class WritingCompositionEvaluationFailureServiceImpl extends ServiceImpl<WritingCompositionEvaluationFailureMapper, WritingCompositionEvaluationFailure> implements WritingCompositionEvaluationFailureService {

    @Override
    public Long saveFailure(WritingCompositionEvaluationFailure entity) {
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
