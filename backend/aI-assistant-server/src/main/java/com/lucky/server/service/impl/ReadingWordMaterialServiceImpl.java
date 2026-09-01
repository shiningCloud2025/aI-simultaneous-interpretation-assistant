package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.domain.dto.ReadingWordMaterialPageQueryDTO;
import com.lucky.server.domain.entity.ReadingWordMaterial;
import com.lucky.server.domain.entity.ReadingWordMaterialFailure;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.ReadingWordMaterialRecordVO;
import com.lucky.server.mapper.ReadingWordMaterialFailureMapper;
import com.lucky.server.mapper.ReadingWordMaterialMapper;
import com.lucky.server.service.ReadingWordMaterialService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 阅读单词素材服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class ReadingWordMaterialServiceImpl extends ServiceImpl<ReadingWordMaterialMapper, ReadingWordMaterial> implements ReadingWordMaterialService {

    private final SysUserService sysUserService;
    private final ReadingWordMaterialFailureMapper readingWordMaterialFailureMapper;

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

    @Override
    public Page<ReadingWordMaterialRecordVO> pageMyMaterialHistory(ReadingWordMaterialPageQueryDTO dto) {
        boolean success = dto.filter() == null || dto.filter().success() == null || Boolean.TRUE.equals(dto.filter().success());
        if (success) {
            return pageSuccessMaterial(dto);
        }
        return pageFailureMaterial(dto);
    }

    private Page<ReadingWordMaterialRecordVO> pageSuccessMaterial(ReadingWordMaterialPageQueryDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<ReadingWordMaterial> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(ReadingWordMaterial::getCreatedById, currentUser.getId());
        wrapper.eq(ReadingWordMaterial::getDeleted, DeletedStatusEnum.NORMAL);
        applySuccessFilter(wrapper, dto.filter());
        wrapper.orderByDesc(ReadingWordMaterial::getCreateTime);

        Page<ReadingWordMaterial> pageResult = page(new Page<>(dto.page(), dto.size()), wrapper);
        List<ReadingWordMaterialRecordVO> records = pageResult.getRecords().stream()
                .map(this::convertSuccessToVO)
                .collect(Collectors.toList());

        return convertPage(pageResult, records);
    }

    private Page<ReadingWordMaterialRecordVO> pageFailureMaterial(ReadingWordMaterialPageQueryDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<ReadingWordMaterialFailure> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(ReadingWordMaterialFailure::getCreatedById, currentUser.getId());
        wrapper.eq(ReadingWordMaterialFailure::getDeleted, DeletedStatusEnum.NORMAL);
        applyFailureFilter(wrapper, dto.filter());
        wrapper.orderByDesc(ReadingWordMaterialFailure::getCreateTime);

        Page<ReadingWordMaterialFailure> page = new Page<>(dto.page(), dto.size());
        Page<ReadingWordMaterialFailure> pageResult = readingWordMaterialFailureMapper.selectPage(page, wrapper);
        List<ReadingWordMaterialRecordVO> records = pageResult.getRecords().stream()
                .map(this::convertFailureToVO)
                .collect(Collectors.toList());

        return convertPage(pageResult, records);
    }

    private void applySuccessFilter(LambdaQueryWrapper<ReadingWordMaterial> wrapper, ReadingWordMaterialPageQueryDTO.Filter filter) {
        if (filter == null) {
            return;
        }
        if (filter.word() != null && !filter.word().isBlank()) {
            wrapper.like(ReadingWordMaterial::getWord, filter.word().trim());
        }
        if (filter.languageCode() != null) {
            wrapper.eq(ReadingWordMaterial::getLanguageCode, filter.languageCode());
        }
        if (filter.stageCode() != null) {
            wrapper.eq(ReadingWordMaterial::getStageCode, filter.stageCode());
        }
    }

    private void applyFailureFilter(LambdaQueryWrapper<ReadingWordMaterialFailure> wrapper, ReadingWordMaterialPageQueryDTO.Filter filter) {
        if (filter == null) {
            return;
        }
        if (filter.word() != null && !filter.word().isBlank()) {
            wrapper.like(ReadingWordMaterialFailure::getWord, filter.word().trim());
        }
        if (filter.languageCode() != null) {
            wrapper.eq(ReadingWordMaterialFailure::getLanguageCode, filter.languageCode());
        }
        if (filter.stageCode() != null) {
            wrapper.eq(ReadingWordMaterialFailure::getStageCode, filter.stageCode());
        }
    }

    private ReadingWordMaterialRecordVO convertSuccessToVO(ReadingWordMaterial entity) {
        return new ReadingWordMaterialRecordVO(
                entity.getId(),
                true,
                entity.getWord(),
                entity.getLanguageCode(),
                entity.getStageCode(),
                entity.getSentence(),
                entity.getTranslation(),
                entity.getImagePrompt(),
                entity.getImageUrl(),
                entity.getProvider(),
                entity.getModelName(),
                entity.getImageProvider(),
                entity.getImageModelName(),
                null,
                null,
                null,
                entity.getCreateTime());
    }

    private ReadingWordMaterialRecordVO convertFailureToVO(ReadingWordMaterialFailure entity) {
        return new ReadingWordMaterialRecordVO(
                entity.getId(),
                false,
                entity.getWord(),
                entity.getLanguageCode(),
                entity.getStageCode(),
                null,
                null,
                null,
                null,
                entity.getProvider(),
                entity.getModelName(),
                entity.getImageProvider(),
                entity.getImageModelName(),
                entity.getFailureStage(),
                entity.getErrorCode(),
                entity.getErrorMessage(),
                entity.getCreateTime());
    }

    private <T> Page<ReadingWordMaterialRecordVO> convertPage(Page<T> pageResult, List<ReadingWordMaterialRecordVO> records) {
        Page<ReadingWordMaterialRecordVO> result = new Page<>();
        result.setRecords(records);
        result.setTotal(pageResult.getTotal());
        result.setSize(pageResult.getSize());
        result.setCurrent(pageResult.getCurrent());
        result.setPages(pageResult.getPages());
        return result;
    }
}
