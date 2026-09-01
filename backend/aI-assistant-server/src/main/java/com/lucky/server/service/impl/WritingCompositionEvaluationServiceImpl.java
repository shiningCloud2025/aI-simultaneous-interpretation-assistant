package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.dto.WritingCompositionEvaluationPageQueryDTO;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.entity.WritingCompositionEvaluation;
import com.lucky.server.domain.entity.WritingCompositionEvaluationFailure;
import com.lucky.server.domain.vo.WritingCompositionEvaluateResultVO;
import com.lucky.server.domain.vo.WritingCompositionEvaluationRecordVO;
import com.lucky.server.mapper.WritingCompositionEvaluationFailureMapper;
import com.lucky.server.mapper.WritingCompositionEvaluationMapper;
import com.lucky.server.service.SysUserService;
import com.lucky.server.service.WritingCompositionEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 写作作文评估记录服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class WritingCompositionEvaluationServiceImpl extends ServiceImpl<WritingCompositionEvaluationMapper, WritingCompositionEvaluation> implements WritingCompositionEvaluationService {

    private final SysUserService sysUserService;
    private final ObjectMapper objectMapper;
    private final WritingCompositionEvaluationFailureMapper writingCompositionEvaluationFailureMapper;

    @Override
    public Long saveEvaluation(WritingCompositionEvaluation entity) {
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
    public Page<WritingCompositionEvaluationRecordVO> pageMyEvaluationHistory(WritingCompositionEvaluationPageQueryDTO dto) {
        boolean success = dto.filter() == null || dto.filter().success() == null || Boolean.TRUE.equals(dto.filter().success());
        if (success) {
            return pageSuccessEvaluation(dto);
        }
        return pageFailureEvaluation(dto);
    }

    private Page<WritingCompositionEvaluationRecordVO> pageSuccessEvaluation(WritingCompositionEvaluationPageQueryDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<WritingCompositionEvaluation> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(WritingCompositionEvaluation::getUserId, currentUser.getId());
        wrapper.eq(WritingCompositionEvaluation::getDeleted, DeletedStatusEnum.NORMAL);
        applySuccessFilter(wrapper, dto.filter());
        wrapper.orderByDesc(WritingCompositionEvaluation::getCreateTime);

        Page<WritingCompositionEvaluation> pageResult = page(new Page<>(dto.page(), dto.size()), wrapper);
        List<WritingCompositionEvaluationRecordVO> records = pageResult.getRecords().stream()
                .map(this::convertSuccessToVO)
                .collect(Collectors.toList());

        return convertPage(pageResult, records);
    }

    private Page<WritingCompositionEvaluationRecordVO> pageFailureEvaluation(WritingCompositionEvaluationPageQueryDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<WritingCompositionEvaluationFailure> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(WritingCompositionEvaluationFailure::getUserId, currentUser.getId());
        wrapper.eq(WritingCompositionEvaluationFailure::getDeleted, DeletedStatusEnum.NORMAL);
        applyFailureFilter(wrapper, dto.filter());
        wrapper.orderByDesc(WritingCompositionEvaluationFailure::getCreateTime);

        Page<WritingCompositionEvaluationFailure> page = new Page<>(dto.page(), dto.size());
        Page<WritingCompositionEvaluationFailure> pageResult = writingCompositionEvaluationFailureMapper.selectPage(page, wrapper);
        List<WritingCompositionEvaluationRecordVO> records = pageResult.getRecords().stream()
                .map(this::convertFailureToVO)
                .collect(Collectors.toList());

        return convertPage(pageResult, records);
    }

    private void applySuccessFilter(LambdaQueryWrapper<WritingCompositionEvaluation> wrapper, WritingCompositionEvaluationPageQueryDTO.Filter filter) {
        if (filter == null) {
            return;
        }
        if (filter.submitType() != null) {
            wrapper.eq(WritingCompositionEvaluation::getSubmitType, filter.submitType());
        }
        if (filter.languageCode() != null) {
            wrapper.eq(WritingCompositionEvaluation::getLanguageCode, filter.languageCode());
        }
        if (filter.stageCode() != null) {
            wrapper.eq(WritingCompositionEvaluation::getStageCode, filter.stageCode());
        }
        if (filter.genreCode() != null) {
            wrapper.eq(WritingCompositionEvaluation::getGenreCode, filter.genreCode());
        }
    }

    private void applyFailureFilter(LambdaQueryWrapper<WritingCompositionEvaluationFailure> wrapper, WritingCompositionEvaluationPageQueryDTO.Filter filter) {
        if (filter == null) {
            return;
        }
        if (filter.submitType() != null) {
            wrapper.eq(WritingCompositionEvaluationFailure::getSubmitType, filter.submitType());
        }
        if (filter.languageCode() != null) {
            wrapper.eq(WritingCompositionEvaluationFailure::getLanguageCode, filter.languageCode());
        }
        if (filter.stageCode() != null) {
            wrapper.eq(WritingCompositionEvaluationFailure::getStageCode, filter.stageCode());
        }
        if (filter.genreCode() != null) {
            wrapper.eq(WritingCompositionEvaluationFailure::getGenreCode, filter.genreCode());
        }
    }

    private WritingCompositionEvaluationRecordVO convertSuccessToVO(WritingCompositionEvaluation entity) {
        return new WritingCompositionEvaluationRecordVO(
                entity.getId(),
                true,
                entity.getGenerationId(),
                entity.getSubmitType(),
                entity.getLanguageCode(),
                entity.getStageCode(),
                entity.getGenreCode(),
                entity.getTitle(),
                entity.getPrompt(),
                entity.getScoringCriteria(),
                entity.getContent(),
                parseStringList(entity.getImageUrlsJson()),
                entity.getOcrText(),
                entity.getScore(),
                entity.getFeedback(),
                entity.getSuggestion(),
                parseStringList(entity.getHighlightsJson()),
                parseStringList(entity.getImprovementPointsJson()),
                parseSentenceFeedbackList(entity.getSentenceFeedbackJson()),
                entity.getImprovedVersion(),
                entity.getProvider(),
                entity.getModelName(),
                null,
                null,
                null,
                entity.getCreateTime());
    }

    private WritingCompositionEvaluationRecordVO convertFailureToVO(WritingCompositionEvaluationFailure entity) {
        return new WritingCompositionEvaluationRecordVO(
                entity.getId(),
                false,
                entity.getGenerationId(),
                entity.getSubmitType(),
                entity.getLanguageCode(),
                entity.getStageCode(),
                entity.getGenreCode(),
                entity.getTitle(),
                entity.getPrompt(),
                entity.getScoringCriteria(),
                entity.getContent(),
                parseStringList(entity.getImageUrlsJson()),
                entity.getOcrText(),
                null,
                null,
                null,
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                null,
                entity.getProvider(),
                entity.getModelName(),
                entity.getFailureStage(),
                entity.getErrorCode(),
                entity.getErrorMessage(),
                entity.getCreateTime());
    }

    private <T> Page<WritingCompositionEvaluationRecordVO> convertPage(Page<T> pageResult, List<WritingCompositionEvaluationRecordVO> records) {
        Page<WritingCompositionEvaluationRecordVO> result = new Page<>();
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

    private List<WritingCompositionEvaluateResultVO.SentenceFeedback> parseSentenceFeedbackList(String json) {
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
