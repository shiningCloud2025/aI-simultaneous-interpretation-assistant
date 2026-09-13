package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.dto.SpeakingMaterialPageQueryDTO;
import com.lucky.server.domain.entity.SpeakingMaterialGeneration;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.SpeakingMaterialRecordVO;
import com.lucky.server.mapper.SpeakingMaterialGenerationMapper;
import com.lucky.server.service.SpeakingMaterialGenerationService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 口语素材生成记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SpeakingMaterialGenerationServiceImpl extends ServiceImpl<SpeakingMaterialGenerationMapper, SpeakingMaterialGeneration> implements SpeakingMaterialGenerationService {

    private final SysUserService sysUserService;

    @Override
    public Long saveGeneration(SpeakingMaterialGeneration entity) {
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

    @Override
    public Page<SpeakingMaterialRecordVO> pageMyMaterialHistory(SpeakingMaterialPageQueryDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<SpeakingMaterialGeneration> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(SpeakingMaterialGeneration::getCreatedById, currentUser.getId());
        wrapper.eq(SpeakingMaterialGeneration::getDeleted, DeletedStatusEnum.NORMAL);

        SpeakingMaterialPageQueryDTO.Filter filter = dto.filter();
        if (filter != null) {
            if (filter.title() != null && !filter.title().isBlank()) {
                wrapper.like(SpeakingMaterialGeneration::getTitle, filter.title().trim());
            }
            if (filter.languageCode() != null) {
                wrapper.eq(SpeakingMaterialGeneration::getLanguageCode, filter.languageCode());
            }
            if (filter.stageCode() != null) {
                wrapper.eq(SpeakingMaterialGeneration::getStageCode, filter.stageCode());
            }
            if (filter.difficultyCode() != null) {
                wrapper.eq(SpeakingMaterialGeneration::getDifficultyCode, filter.difficultyCode());
            }
            if (filter.sceneCode() != null) {
                wrapper.eq(SpeakingMaterialGeneration::getSceneCode, filter.sceneCode());
            }
        }

        wrapper.orderByDesc(SpeakingMaterialGeneration::getCreateTime);

        Page<SpeakingMaterialGeneration> pageResult = page(new Page<>(dto.page(), dto.size()), wrapper);
        List<SpeakingMaterialRecordVO> records = pageResult.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return convertPage(pageResult, records);
    }

    private SpeakingMaterialRecordVO convertToVO(SpeakingMaterialGeneration entity) {
        return new SpeakingMaterialRecordVO(
                entity.getId(),
                entity.getLanguageCode(),
                entity.getStageCode(),
                entity.getDifficultyCode(),
                entity.getSceneCode(),
                entity.getUserPrompt(),
                entity.getTitle(),
                entity.getSceneDescription(),
                entity.getProvider(),
                entity.getModelName(),
                entity.getTtsProvider(),
                entity.getTtsModelName(),
                entity.getTtsVoice(),
                entity.getTtsSpeechRate(),
                entity.getCreateTime());
    }

    private <T> Page<SpeakingMaterialRecordVO> convertPage(Page<T> pageResult, List<SpeakingMaterialRecordVO> records) {
        Page<SpeakingMaterialRecordVO> result = new Page<>();
        result.setRecords(records);
        result.setTotal(pageResult.getTotal());
        result.setSize(pageResult.getSize());
        result.setCurrent(pageResult.getCurrent());
        result.setPages(pageResult.getPages());
        return result;
    }
}
