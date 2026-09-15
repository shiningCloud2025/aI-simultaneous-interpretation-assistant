package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.entity.SpeakingMaterialGenerationFailure;
import com.lucky.server.mapper.SpeakingMaterialGenerationFailureMapper;
import com.lucky.server.service.SpeakingMaterialGenerationFailureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 口语素材生成失败记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SpeakingMaterialGenerationFailureServiceImpl extends ServiceImpl<SpeakingMaterialGenerationFailureMapper, SpeakingMaterialGenerationFailure> implements SpeakingMaterialGenerationFailureService {

    @Override
    public Long saveFailure(SpeakingMaterialGenerationFailure entity) {
        LocalDateTime now = LocalDateTime.now();
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        entity.setUpdatedById(entity.getCreatedById());
        entity.setDeleted(DeletedStatusEnum.NORMAL);
        save(entity);
        return entity.getId();
    }
}
