package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.dto.SysUserShortcutConfigSaveDTO.ShortcutItem;
import com.lucky.server.domain.entity.SysUserShortcutConfig;
import com.lucky.server.domain.vo.SysUserShortcutConfigVO;
import com.lucky.server.mapper.SysUserShortcutConfigMapper;
import com.lucky.server.service.SysUserShortcutConfigService;
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
 * 系统用户快捷键配置 Service 实现
 * @author shiningCloud2025
 */
@Slf4j
@Service
public class SysUserShortcutConfigServiceImpl extends ServiceImpl<SysUserShortcutConfigMapper, SysUserShortcutConfig> implements SysUserShortcutConfigService {

    @Override
    public List<SysUserShortcutConfigVO> listByUserId() {
        // TODO: 后续从 SecurityContext 获取当前用户ID
        Long userId = null;
        return lambdaQuery().eq(SysUserShortcutConfig::getUserId, userId).list()
                .stream()
                .map(e -> new SysUserShortcutConfigVO(e.getId(), e.getAction(), e.getKeyCombination()))
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void batchSaveOrUpdate(List<ShortcutItem> dtos) {
        // TODO: 后续从 SecurityContext 获取当前用户ID
        Long userId = null;

        List<SysUserShortcutConfig> existingList = lambdaQuery()
                .eq(SysUserShortcutConfig::getUserId, userId).list();

        Set<Long> existingIds = existingList.stream()
                .map(SysUserShortcutConfig::getId).collect(Collectors.toSet());

        // 要更新的 id 集合（dto.id 不为 null）
        Set<Long> updateIds = dtos.stream()
                .map(ShortcutItem::id).filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // 校验：要更新的 id 必须全部存在于数据库中
        if (!existingIds.containsAll(updateIds)) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "部分快捷键配置不存在");
        }

        // 已存在但不在更新集合中的 → 删除
        List<Long> toDelete = existingList.stream()
                .map(SysUserShortcutConfig::getId)
                .filter(id -> !updateIds.contains(id))
                .toList();

        LocalDateTime now = LocalDateTime.now();
        List<SysUserShortcutConfig> all = new ArrayList<>();

        for (ShortcutItem dto : dtos) {
            SysUserShortcutConfig entity = new SysUserShortcutConfig();
            if (dto.id() != null) {
                entity.setId(dto.id());
            } else {
                entity.setUserId(userId);
                entity.setCreateTime(now);
            }
            entity.setAction(dto.action());
            entity.setKeyCombination(dto.keyCombination());
            entity.setUpdateTime(now);
            all.add(entity);
        }

        if (!all.isEmpty()) saveOrUpdateBatch(all);
        if (!toDelete.isEmpty()) removeByIds(toDelete);
    }
}
