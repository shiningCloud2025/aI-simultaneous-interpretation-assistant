package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.entity.SpeakingMaterialGenerationFailure;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.mapper.SpeakingMaterialGenerationFailureMapper;
import com.lucky.server.service.SpeakingMaterialGenerationFailureService;
import com.lucky.server.service.SysUserService;
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

    private final SysUserService sysUserService;

    @Override
    public Long saveFailure(SpeakingMaterialGenerationFailure entity) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedById(currentUser.getId());
        entity.setUpdatedById(currentUser.getId());
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        entity.setDeleted(DeletedStatusEnum.NORMAL);
        save(entity);
        return entity.getId();
    }
}
