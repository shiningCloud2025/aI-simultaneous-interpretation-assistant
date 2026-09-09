package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.entity.SpeakingEvaluationRecord;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.mapper.SpeakingEvaluationRecordMapper;
import com.lucky.server.service.SpeakingEvaluationRecordService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 口语跟读评测记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SpeakingEvaluationRecordServiceImpl extends ServiceImpl<SpeakingEvaluationRecordMapper, SpeakingEvaluationRecord> implements SpeakingEvaluationRecordService {

    private final SysUserService sysUserService;

    @Override
    public Long saveRecord(SpeakingEvaluationRecord entity) {
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语跟读评测记录不能为空");
        }

        SysUser currentUser = sysUserService.getCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        entity.setUserId(currentUser.getId());
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        entity.setDeleted(DeletedStatusEnum.NORMAL);

        save(entity);
        return entity.getId();
    }
}
