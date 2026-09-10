package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.entity.SpeakingEvaluationRecord;
import com.lucky.server.domain.entity.SpeakingMaterialGeneration;
import com.lucky.server.domain.entity.SpeakingMaterialSentence;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.SpeakingEvaluationLatestRecordVO;
import com.lucky.server.domain.vo.SpeakingEvaluationWordVO;
import com.lucky.server.domain.vo.SpeakingMaterialPracticeDetailVO;
import com.lucky.server.domain.vo.SpeakingMaterialPracticeSentenceVO;
import com.lucky.server.mapper.SpeakingEvaluationRecordMapper;
import com.lucky.server.mapper.SpeakingMaterialGenerationMapper;
import com.lucky.server.mapper.SpeakingMaterialSentenceMapper;
import com.lucky.server.service.SpeakingMaterialSentenceService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 口语素材句子明细服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SpeakingMaterialSentenceServiceImpl extends ServiceImpl<SpeakingMaterialSentenceMapper, SpeakingMaterialSentence> implements SpeakingMaterialSentenceService {

    private final SysUserService sysUserService;
    private final ObjectMapper objectMapper;
    private final SpeakingMaterialGenerationMapper speakingMaterialGenerationMapper;
    private final SpeakingEvaluationRecordMapper speakingEvaluationRecordMapper;

    @Override
    public Long saveSentence(SpeakingMaterialSentence entity) {
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
    public SpeakingMaterialSentence getSentenceById(Long id) {
        SpeakingMaterialSentence sentence = getById(id);
        if (sentence == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语素材句子不存在");
        }
        return sentence;
    }

    @Override
    public SpeakingMaterialPracticeDetailVO getPracticeDetail(Long materialId) {
        if (materialId == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语素材ID不能为空");
        }

        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<SpeakingMaterialGeneration> materialWrapper = Wrappers.lambdaQuery();
        materialWrapper.eq(SpeakingMaterialGeneration::getId, materialId);
        materialWrapper.eq(SpeakingMaterialGeneration::getCreatedById, currentUser.getId());
        materialWrapper.eq(SpeakingMaterialGeneration::getDeleted, DeletedStatusEnum.NORMAL);
        SpeakingMaterialGeneration material = speakingMaterialGenerationMapper.selectOne(materialWrapper);
        if (material == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语素材不存在");
        }

        LambdaQueryWrapper<SpeakingMaterialSentence> sentenceWrapper = Wrappers.lambdaQuery();
        sentenceWrapper.eq(SpeakingMaterialSentence::getMaterialId, materialId);
        sentenceWrapper.eq(SpeakingMaterialSentence::getDeleted, DeletedStatusEnum.NORMAL);
        sentenceWrapper.orderByAsc(SpeakingMaterialSentence::getSortOrder);
        List<SpeakingMaterialSentence> sentences = list(sentenceWrapper);

        Map<Long, SpeakingEvaluationRecord> latestRecordMap = queryLatestEvaluationMap(currentUser.getId(), materialId, sentences);
        List<SpeakingMaterialPracticeSentenceVO> sentenceVOList = sentences.stream()
                .map(sentence -> convertSentenceToVO(sentence, latestRecordMap.get(sentence.getId())))
                .collect(Collectors.toList());

        return new SpeakingMaterialPracticeDetailVO(
                material.getId(),
                material.getTitle(),
                material.getSceneDescription(),
                material.getLanguageCode(),
                material.getStageCode(),
                material.getDifficultyCode(),
                material.getSceneCode(),
                sentenceVOList);
    }

    private Map<Long, SpeakingEvaluationRecord> queryLatestEvaluationMap(Long userId,
                                                                         Long materialId,
                                                                         List<SpeakingMaterialSentence> sentences) {
        if (sentences == null || sentences.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Long> sentenceIds = sentences.stream()
                .map(SpeakingMaterialSentence::getId)
                .toList();

        LambdaQueryWrapper<SpeakingEvaluationRecord> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(SpeakingEvaluationRecord::getUserId, userId);
        wrapper.eq(SpeakingEvaluationRecord::getMaterialId, materialId);
        wrapper.in(SpeakingEvaluationRecord::getSentenceId, sentenceIds);
        wrapper.eq(SpeakingEvaluationRecord::getSuccess, true);
        wrapper.eq(SpeakingEvaluationRecord::getDeleted, DeletedStatusEnum.NORMAL);
        wrapper.orderByDesc(SpeakingEvaluationRecord::getCreateTime);

        List<SpeakingEvaluationRecord> records = speakingEvaluationRecordMapper.selectList(wrapper);
        return records.stream()
                .collect(Collectors.toMap(
                        SpeakingEvaluationRecord::getSentenceId,
                        Function.identity(),
                        (first, ignored) -> first
                ));
    }

    private SpeakingMaterialPracticeSentenceVO convertSentenceToVO(SpeakingMaterialSentence sentence,
                                                                   SpeakingEvaluationRecord latestRecord) {
        return new SpeakingMaterialPracticeSentenceVO(
                sentence.getId(),
                sentence.getSortOrder(),
                sentence.getSentence(),
                sentence.getTranslation(),
                sentence.getStandardAudioUrl(),
                parseStringList(sentence.getKeyPoints()),
                parseStringList(sentence.getPracticeTips()),
                convertLatestEvaluationToVO(latestRecord));
    }

    private SpeakingEvaluationLatestRecordVO convertLatestEvaluationToVO(SpeakingEvaluationRecord record) {
        if (record == null) {
            return null;
        }

        return new SpeakingEvaluationLatestRecordVO(
                record.getId(),
                record.getStudentAudioUrl(),
                record.getRecognizedText(),
                record.getSuggestedScore(),
                record.getPronAccuracy(),
                record.getPronFluency(),
                record.getPronCompletion(),
                parseWordList(record.getWordResultJson()),
                record.getCreateTime());
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

    private List<SpeakingEvaluationWordVO> parseWordList(String json) {
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
