package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.dto.SysUserTermLibrarySaveDTO;
import com.lucky.server.domain.entity.SysUserTermEntry;
import com.lucky.server.domain.entity.SysUserTermLibrary;
import com.lucky.server.domain.vo.SysUserTermLibraryVO;
import com.lucky.server.mapper.SysUserTermEntryMapper;
import com.lucky.server.mapper.SysUserTermLibraryMapper;
import com.lucky.server.service.SysUserTermLibraryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 系统用户术语库 Service 实现
 * @author shiningCloud2025
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysUserTermLibraryServiceImpl extends ServiceImpl<SysUserTermLibraryMapper, SysUserTermLibrary> implements SysUserTermLibraryService {

    private final SysUserTermEntryMapper termEntryMapper;

    @Override
    public List<SysUserTermLibraryVO> listByUserId() {
        // TODO: 后续从 SecurityContext 获取当前用户ID
        Long userId = null;

        List<SysUserTermLibrary> libraries = lambdaQuery()
                .eq(SysUserTermLibrary::getUserId, userId).list();
        if (libraries.isEmpty()) return List.of();

        List<Long> libraryIds = libraries.stream()
                .map(SysUserTermLibrary::getId).toList();
        Map<Long, Long> countMap = termEntryMapper.selectList(null).stream()
                .filter(e -> libraryIds.contains(e.getLibraryId()))
                .collect(Collectors.groupingBy(SysUserTermEntry::getLibraryId, Collectors.counting()));

        return libraries.stream().map(lib -> new SysUserTermLibraryVO(
                lib.getId(), lib.getName(), lib.getIsDefault(),
                countMap.getOrDefault(lib.getId(), 0L),
                lib.getCreateTime(), lib.getUpdateTime()
        )).toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SysUserTermLibraryVO create(SysUserTermLibrarySaveDTO dto) {
        // TODO: 后续从 SecurityContext 获取当前用户ID
        Long userId = null;
        LocalDateTime now = LocalDateTime.now();

        // 如果设为默认，先清掉其他默认
        if (dto.isDefault() == 1) {
            lambdaUpdate()
                    .eq(SysUserTermLibrary::getUserId, userId)
                    .eq(SysUserTermLibrary::getIsDefault, 1)
                    .set(SysUserTermLibrary::getIsDefault, 0)
                    .update();
        }

        SysUserTermLibrary entity = new SysUserTermLibrary();
        entity.setUserId(userId);
        entity.setName(dto.name());
        entity.setIsDefault(dto.isDefault());
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        save(entity);

        return new SysUserTermLibraryVO(entity.getId(), entity.getName(), entity.getIsDefault(),
                0L, entity.getCreateTime(), entity.getUpdateTime());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SysUserTermLibraryVO update(Long id, SysUserTermLibrarySaveDTO dto) {
        SysUserTermLibrary entity = getById(id);
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "术语库不存在");
        }

        // 如果设为默认，先清掉其他默认
        if (dto.isDefault() == 1) {
            lambdaUpdate()
                    .eq(SysUserTermLibrary::getUserId, entity.getUserId())
                    .eq(SysUserTermLibrary::getIsDefault, 1)
                    .set(SysUserTermLibrary::getIsDefault, 0)
                    .update();
        }

        entity.setName(dto.name());
        entity.setIsDefault(dto.isDefault());
        entity.setUpdateTime(LocalDateTime.now());
        updateById(entity);

        Long count = termEntryMapper.selectCount(
                new LambdaQueryWrapper<SysUserTermEntry>()
                        .eq(SysUserTermEntry::getLibraryId, id));
        return new SysUserTermLibraryVO(entity.getId(), entity.getName(), entity.getIsDefault(),
                count, entity.getCreateTime(), entity.getUpdateTime());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        termEntryMapper.delete(
                new LambdaQueryWrapper<SysUserTermEntry>()
                        .eq(SysUserTermEntry::getLibraryId, id));
        removeById(id);
    }
}
