package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.entity.ReadingWordMaterial;
import com.lucky.server.mapper.ReadingWordMaterialMapper;
import com.lucky.server.service.ReadingWordMaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 阅读单词素材服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class ReadingWordMaterialServiceImpl extends ServiceImpl<ReadingWordMaterialMapper, ReadingWordMaterial> implements ReadingWordMaterialService {

    @Override
    public Long saveMaterial(ReadingWordMaterial entity) {
        LocalDateTime now = LocalDateTime.now();
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        entity.setUpdatedById(entity.getCreatedById());
        entity.setDeleted(DeletedStatusEnum.NORMAL);
        save(entity);
        return entity.getId();
    }
}
