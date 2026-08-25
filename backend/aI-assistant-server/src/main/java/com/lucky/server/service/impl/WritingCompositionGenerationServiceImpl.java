package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.entity.WritingCompositionGeneration;
import com.lucky.server.mapper.WritingCompositionGenerationMapper;
import com.lucky.server.service.WritingCompositionGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 写作作文生成记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class WritingCompositionGenerationServiceImpl extends ServiceImpl<WritingCompositionGenerationMapper, WritingCompositionGeneration> implements WritingCompositionGenerationService {

    @Override
    public Long saveGeneration(WritingCompositionGeneration entity) {
        LocalDateTime now = LocalDateTime.now();
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        entity.setCreatedById(entity.getUserId());
        entity.setUpdatedById(entity.getUserId());
        entity.setDeleted(DeletedStatusEnum.NORMAL);
        save(entity);
        return entity.getId();
    }

    @Override
    public WritingCompositionGeneration getNormalById(Long id) {
        return lambdaQuery()
                .eq(WritingCompositionGeneration::getId, id)
                .eq(WritingCompositionGeneration::getDeleted, DeletedStatusEnum.NORMAL)
                .one();
    }
}
