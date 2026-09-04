package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.entity.SpeakingMaterialSentence;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.mapper.SpeakingMaterialSentenceMapper;
import com.lucky.server.service.SpeakingMaterialSentenceService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 口语素材句子明细服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SpeakingMaterialSentenceServiceImpl extends ServiceImpl<SpeakingMaterialSentenceMapper, SpeakingMaterialSentence> implements SpeakingMaterialSentenceService {

    private final SysUserService sysUserService;

    @Override
    public Long saveSentence(SpeakingMaterialSentence entity) {
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
