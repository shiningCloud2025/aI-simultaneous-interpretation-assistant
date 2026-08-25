package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.dto.WritingCompositionGenerationPageQueryDTO;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.entity.WritingCompositionGeneration;
import com.lucky.server.domain.entity.WritingCompositionGenerationFailure;
import com.lucky.server.domain.vo.WritingCompositionGenerationRecordVO;
import com.lucky.server.mapper.WritingCompositionGenerationFailureMapper;
import com.lucky.server.mapper.WritingCompositionGenerationMapper;
import com.lucky.server.service.SysUserService;
import com.lucky.server.service.WritingCompositionGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 写作作文生成记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class WritingCompositionGenerationServiceImpl extends ServiceImpl<WritingCompositionGenerationMapper, WritingCompositionGeneration> implements WritingCompositionGenerationService {

    private final SysUserService sysUserService;
    private final ObjectMapper objectMapper;
    private final WritingCompositionGenerationFailureMapper writingCompositionGenerationFailureMapper;

    @Override
    public Long saveGeneration(WritingCompositionGeneration entity) {
        LocalDateTime now = LocalDateTime.now();
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        entity.setCreatedById(entity.getUserId());
        entity.setUpdatedById(entity.getUserId());
        entity.setDeleted(DeletedStatusEnum.NORMAL);
        save(entity);
        return entity.getId();
    }

    @Override
    public WritingCompositionGeneration getNormalById(Long id) {
        return lambdaQuery()
                .eq(WritingCompositionGeneration::getId, id)
                .eq(WritingCompositionGeneration::getDeleted, DeletedStatusEnum.NORMAL)
                .one();
    }

    @Override
    public Page<WritingCompositionGenerationRecordVO> pageMyGenerationHistory(WritingCompositionGenerationPageQueryDTO dto) {
        boolean success = dto.filter() == null || dto.filter().success() == null || Boolean.TRUE.equals(dto.filter().success());
        if (success) {
            return pageSuccessGeneration(dto);
        }
        return pageFailureGeneration(dto);
    }

    private Page<WritingCompositionGenerationRecordVO> pageSuccessGeneration(WritingCompositionGenerationPageQueryDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<WritingCompositionGeneration> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(WritingCompositionGeneration::getUserId, currentUser.getId());
        wrapper.eq(WritingCompositionGeneration::getDeleted, DeletedStatusEnum.NORMAL);
        applySuccessFilter(wrapper, dto.filter());
        wrapper.orderByDesc(WritingCompositionGeneration::getCreateTime);

        Page<WritingCompositionGeneration> pageResult = page(new Page<>(dto.page(), dto.size()), wrapper);
        List<WritingCompositionGenerationRecordVO> records = pageResult.getRecords().stream()
                .map(this::convertSuccessToVO)
                .collect(Collectors.toList());

        return convertPage(pageResult, records);
    }

    private Page<WritingCompositionGenerationRecordVO> pageFailureGeneration(WritingCompositionGenerationPageQueryDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<WritingCompositionGenerationFailure> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(WritingCompositionGenerationFailure::getUserId, currentUser.getId());
        wrapper.eq(WritingCompositionGenerationFailure::getDeleted, DeletedStatusEnum.NORMAL);
        applyFailureFilter(wrapper, dto.filter());
        wrapper.orderByDesc(WritingCompositionGenerationFailure::getCreateTime);

        Page<WritingCompositionGenerationFailure> page = new Page<>(dto.page(), dto.size());
        Page<WritingCompositionGenerationFailure> pageResult = writingCompositionGenerationFailureMapper.selectPage(page, wrapper);
        List<WritingCompositionGenerationRecordVO> records = pageResult.getRecords().stream()
                .map(this::convertFailureToVO)
                .collect(Collectors.toList());

        return convertPage(pageResult, records);
    }

    private void applySuccessFilter(LambdaQueryWrapper<WritingCompositionGeneration> wrapper, WritingCompositionGenerationPageQueryDTO.Filter filter) {
        if (filter == null) {
            return;
        }
        if (filter.languageCode() != null) {
            wrapper.eq(WritingCompositionGeneration::getLanguageCode, filter.languageCode());
        }
        if (filter.stageCode() != null) {
            wrapper.eq(WritingCompositionGeneration::getStageCode, filter.stageCode());
        }
        if (filter.genreCode() != null) {
            wrapper.eq(WritingCompositionGeneration::getGenreCode, filter.genreCode());
        }
        if (filter.difficultyCode() != null) {
            wrapper.eq(WritingCompositionGeneration::getDifficultyCode, filter.difficultyCode());
        }
        if (filter.sceneCode() != null) {
            wrapper.eq(WritingCompositionGeneration::getSceneCode, filter.sceneCode());
        }
    }

    private void applyFailureFilter(LambdaQueryWrapper<WritingCompositionGenerationFailure> wrapper, WritingCompositionGenerationPageQueryDTO.Filter filter) {
        if (filter == null) {
            return;
        }
        if (filter.languageCode() != null) {
            wrapper.eq(WritingCompositionGenerationFailure::getLanguageCode, filter.languageCode());
        }
        if (filter.stageCode() != null) {
            wrapper.eq(WritingCompositionGenerationFailure::getStageCode, filter.stageCode());
        }
        if (filter.genreCode() != null) {
            wrapper.eq(WritingCompositionGenerationFailure::getGenreCode, filter.genreCode());
        }
        if (filter.difficultyCode() != null) {
            wrapper.eq(WritingCompositionGenerationFailure::getDifficultyCode, filter.difficultyCode());
        }
        if (filter.sceneCode() != null) {
            wrapper.eq(WritingCompositionGenerationFailure::getSceneCode, filter.sceneCode());
        }
    }

    private WritingCompositionGenerationRecordVO convertSuccessToVO(WritingCompositionGeneration entity) {
        return new WritingCompositionGenerationRecordVO(
                entity.getId(),
                true,
                entity.getLanguageCode(),
                entity.getStageCode(),
                entity.getGenreCode(),
                entity.getDifficultyCode(),
                entity.getSceneCode(),
                entity.getCustomScene(),
                entity.getTitle(),
                entity.getPrompt(),
                entity.getRequirement(),
                entity.getWordLimitMin(),
                entity.getWordLimitMax(),
                parseStringList(entity.getKeyPointsJson()),
                parseStringList(entity.getVocabularyHintsJson()),
                parseStringList(entity.getStructureHintsJson()),
                parseStringList(entity.getScoringCriteriaJson()),
                entity.getProvider(),
                entity.getModelName(),
                null,
                null,
                null,
                entity.getCreateTime());
    }

    private WritingCompositionGenerationRecordVO convertFailureToVO(WritingCompositionGenerationFailure entity) {
        return new WritingCompositionGenerationRecordVO(
                entity.getId(),
                false,
                entity.getLanguageCode(),
                entity.getStageCode(),
                entity.getGenreCode(),
                entity.getDifficultyCode(),
                entity.getSceneCode(),
                entity.getCustomScene(),
                null,
                null,
                null,
                null,
                null,
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                entity.getProvider(),
                entity.getModelName(),
                entity.getFailureStage(),
                entity.getErrorCode(),
                entity.getErrorMessage(),
                entity.getCreateTime());
    }

    private <T> Page<WritingCompositionGenerationRecordVO> convertPage(Page<T> pageResult, List<WritingCompositionGenerationRecordVO> records) {
        Page<WritingCompositionGenerationRecordVO> result = new Page<>();
        result.setRecords(records);
        result.setTotal(pageResult.getTotal());
        result.setSize(pageResult.getSize());
        result.setCurrent(pageResult.getCurrent());
        result.setPages(pageResult.getPages());
        return result;
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
