package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.dto.SpeakingMaterialPageQueryDTO;
import com.lucky.server.domain.entity.SpeakingMaterialGeneration;
import com.lucky.server.domain.entity.SpeakingMaterialGenerationFailure;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.SpeakingMaterialRecordVO;
import com.lucky.server.mapper.SpeakingMaterialGenerationFailureMapper;
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
    private final SpeakingMaterialGenerationFailureMapper speakingMaterialGenerationFailureMapper;

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
        boolean success = dto.filter() == null || dto.filter().success() == null || Boolean.TRUE.equals(dto.filter().success());
        if (success) {
            return pageSuccessMaterial(dto);
        }
        return pageFailureMaterial(dto);
    }

    private Page<SpeakingMaterialRecordVO> pageSuccessMaterial(SpeakingMaterialPageQueryDTO dto) {
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
                .map(this::convertSuccessToVO)
                .collect(Collectors.toList());

        return convertPage(pageResult, records);
    }

    private Page<SpeakingMaterialRecordVO> pageFailureMaterial(SpeakingMaterialPageQueryDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<SpeakingMaterialGenerationFailure> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(SpeakingMaterialGenerationFailure::getCreatedById, currentUser.getId());
        wrapper.eq(SpeakingMaterialGenerationFailure::getDeleted, DeletedStatusEnum.NORMAL);

        SpeakingMaterialPageQueryDTO.Filter filter = dto.filter();
        if (filter != null) {
            if (filter.languageCode() != null) {
                wrapper.eq(SpeakingMaterialGenerationFailure::getLanguageCode, filter.languageCode());
            }
            if (filter.stageCode() != null) {
                wrapper.eq(SpeakingMaterialGenerationFailure::getStageCode, filter.stageCode());
            }
            if (filter.difficultyCode() != null) {
                wrapper.eq(SpeakingMaterialGenerationFailure::getDifficultyCode, filter.difficultyCode());
            }
            if (filter.sceneCode() != null) {
                wrapper.eq(SpeakingMaterialGenerationFailure::getSceneCode, filter.sceneCode());
            }
        }

        wrapper.orderByDesc(SpeakingMaterialGenerationFailure::getCreateTime);

        Page<SpeakingMaterialGenerationFailure> page = new Page<>(dto.page(), dto.size());
        Page<SpeakingMaterialGenerationFailure> pageResult = speakingMaterialGenerationFailureMapper.selectPage(page, wrapper);
        List<SpeakingMaterialRecordVO> records = pageResult.getRecords().stream()
                .map(this::convertFailureToVO)
                .collect(Collectors.toList());

        return convertPage(pageResult, records);
    }

    private SpeakingMaterialRecordVO convertSuccessToVO(SpeakingMaterialGeneration entity) {
        return new SpeakingMaterialRecordVO(
                entity.getId(),
                true,
                entity.getLanguageCode(),
                entity.getStageCode(),
                entity.getDifficultyCode(),
                entity.getSceneCode(),
                entity.getCustomScene(),
                entity.getUserPrompt(),
                entity.getTitle(),
                entity.getSceneDescription(),
                entity.getProvider(),
                entity.getModelName(),
                entity.getTtsProvider(),
                entity.getTtsModelName(),
                entity.getTtsVoice(),
                entity.getTtsSpeechRate(),
                null,
                null,
                entity.getCreateTime());
    }

    private SpeakingMaterialRecordVO convertFailureToVO(SpeakingMaterialGenerationFailure entity) {
        return new SpeakingMaterialRecordVO(
                entity.getId(),
                false,
                entity.getLanguageCode(),
                entity.getStageCode(),
                entity.getDifficultyCode(),
                entity.getSceneCode(),
                entity.getCustomScene(),
                entity.getUserPrompt(),
                null,
                null,
                entity.getProvider(),
                entity.getModelName(),
                entity.getTtsProvider(),
                entity.getTtsModelName(),
                entity.getTtsVoice(),
                entity.getTtsSpeechRate(),
                entity.getFailureStage(),
                entity.getErrorMessage(),
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
