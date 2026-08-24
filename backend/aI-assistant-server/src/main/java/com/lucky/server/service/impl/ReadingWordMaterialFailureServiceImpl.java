package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.entity.ReadingWordMaterialFailure;
import com.lucky.server.mapper.ReadingWordMaterialFailureMapper;
import com.lucky.server.service.ReadingWordMaterialFailureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 阅读单词素材失败记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class ReadingWordMaterialFailureServiceImpl extends ServiceImpl<ReadingWordMaterialFailureMapper, ReadingWordMaterialFailure> implements ReadingWordMaterialFailureService {

    @Override
    public Long saveFailure(ReadingWordMaterialFailure entity) {
        LocalDateTime now = LocalDateTime.now();
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        entity.setUpdatedById(entity.getCreatedById());
        entity.setDeleted(DeletedStatusEnum.NORMAL);
        save(entity);
        return entity.getId();
    }
}
