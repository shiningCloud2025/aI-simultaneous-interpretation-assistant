package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.dto.SysUserTermEntrySaveDTO.EntryItem;
import com.lucky.server.domain.entity.SysUserTermEntry;
import com.lucky.server.domain.vo.SysUserTermEntryVO;
import com.lucky.server.mapper.SysUserTermEntryMapper;
import com.lucky.server.service.SysUserTermEntryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 系统用户术语条目 Service 实现
 * @author shiningCloud2025
 */
@Slf4j
@Service
public class SysUserTermEntryServiceImpl extends ServiceImpl<SysUserTermEntryMapper, SysUserTermEntry> implements SysUserTermEntryService {

    @Override
    public List<SysUserTermEntryVO> listByLibraryId(Long libraryId) {
        return lambdaQuery().eq(SysUserTermEntry::getLibraryId, libraryId).list()
                .stream()
                .map(e -> new SysUserTermEntryVO(e.getId(), e.getSourceTerm(), e.getTargetTerm(),
                        e.getDirection(), e.getCreateTime(), e.getUpdateTime()))
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchSaveOrUpdate(Long libraryId, List<EntryItem> dtos) {
        List<SysUserTermEntry> existingList = lambdaQuery()
                .eq(SysUserTermEntry::getLibraryId, libraryId).list();

        Set<Long> existingIds = existingList.stream()
                .map(SysUserTermEntry::getId).collect(Collectors.toSet());

        Set<Long> updateIds = dtos.stream()
                .map(EntryItem::id).filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (!existingIds.containsAll(updateIds)) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "部分术语条目不存在");
        }

        List<Long> toDelete = existingList.stream()
                .map(SysUserTermEntry::getId)
                .filter(id -> !updateIds.contains(id))
                .toList();

        LocalDateTime now = LocalDateTime.now();
        List<SysUserTermEntry> all = new ArrayList<>();

        for (EntryItem dto : dtos) {
            SysUserTermEntry entity = new SysUserTermEntry();
            if (dto.id() != null) {
                entity.setId(dto.id());
            } else {
                entity.setLibraryId(libraryId);
                entity.setCreateTime(now);
            }
            entity.setSourceTerm(dto.sourceTerm());
            entity.setTargetTerm(dto.targetTerm());
            entity.setDirection(dto.direction());
            entity.setUpdateTime(now);
            all.add(entity);
        }

        if (!all.isEmpty()) saveOrUpdateBatch(all);
        if (!toDelete.isEmpty()) removeByIds(toDelete);
    }
}
