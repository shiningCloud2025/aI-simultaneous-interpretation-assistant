package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.entity.WritingCompositionGenerationFailure;
import com.lucky.server.mapper.WritingCompositionGenerationFailureMapper;
import com.lucky.server.service.WritingCompositionGenerationFailureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 写作作文生成失败记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class WritingCompositionGenerationFailureServiceImpl extends ServiceImpl<WritingCompositionGenerationFailureMapper, WritingCompositionGenerationFailure> implements WritingCompositionGenerationFailureService {

    @Override
    public Long saveFailure(WritingCompositionGenerationFailure entity) {
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
