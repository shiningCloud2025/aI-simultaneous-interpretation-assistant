package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.AttachmentBizTypeEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.FeedbackStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.dto.FeedbackPageQueryDTO;
import com.lucky.server.domain.dto.SysUserFeedbackSubmitDTO;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.entity.SysUserFeedback;
import com.lucky.server.domain.vo.SysUserFeedbackDetailVO;
import com.lucky.server.domain.vo.SysUserFeedbackVO;
import com.lucky.server.domain.vo.SysFileVO;
import com.lucky.server.mapper.SysUserFeedbackMapper;
import com.lucky.server.service.SysAttachmentService;
import com.lucky.server.service.SysUserFeedbackService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 用户反馈 Service 实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SysUserFeedbackServiceImpl extends ServiceImpl<SysUserFeedbackMapper, SysUserFeedback> implements SysUserFeedbackService {

    private final SysUserService sysUserService;
    private final SysAttachmentService sysAttachmentService;

    @Override
    public void submit(SysUserFeedbackSubmitDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        SysUserFeedback feedback = new SysUserFeedback();
        feedback.setFeedbackNo(generateFeedbackNo());
        feedback.setUserId(currentUser.getId());
        feedback.setType(dto.type());
        feedback.setTitle(dto.title());
        feedback.setContent(dto.content());
        feedback.setStatus(FeedbackStatusEnum.PENDING);
        feedback.setDeleted(DeletedStatusEnum.NORMAL);
        feedback.setCreateTime(LocalDateTime.now());
        feedback.setUpdateTime(LocalDateTime.now());

        save(feedback);

        if (!CollectionUtils.isEmpty(dto.fileIds())) {
            sysAttachmentService.bind(AttachmentBizTypeEnum.FEEDBACK, feedback.getId(), dto.fileIds());
        }
    }

    @Override
    public Page<SysUserFeedbackVO> pageMyFeedback(FeedbackPageQueryDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();

        LambdaQueryWrapper<SysUserFeedback> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(SysUserFeedback::getUserId, currentUser.getId());
        wrapper.eq(SysUserFeedback::getDeleted, DeletedStatusEnum.NORMAL);

        FeedbackPageQueryDTO.Filter filter = dto.filter();
        if (filter != null) {
            if (filter.title() != null && !filter.title().isBlank()) {
                wrapper.like(SysUserFeedback::getTitle, filter.title());
            }
            if (filter.type() != null) {
                wrapper.eq(SysUserFeedback::getType, filter.type());
            }
            if (filter.status() != null) {
                wrapper.eq(SysUserFeedback::getStatus, filter.status());
            }
        }

        wrapper.orderByDesc(SysUserFeedback::getCreateTime);

        Page<SysUserFeedback> pageResult = page(new Page<>(dto.page(), dto.size()), wrapper);

        List<SysUserFeedbackVO> records = pageResult.getRecords().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        Page<SysUserFeedbackVO> result = new Page<>();
        result.setRecords(records);
        result.setTotal(pageResult.getTotal());
        result.setSize(pageResult.getSize());
        result.setCurrent(pageResult.getCurrent());
        result.setPages(pageResult.getPages());

        return result;
    }

    @Override
    public SysUserFeedbackDetailVO detail(Long id) {
        SysUser currentUser = sysUserService.getCurrentUser();

        SysUserFeedback feedback = getOne(
                Wrappers.<SysUserFeedback>lambdaQuery()
                        .eq(SysUserFeedback::getId, id)
                        .eq(SysUserFeedback::getUserId, currentUser.getId())
                        .eq(SysUserFeedback::getDeleted, DeletedStatusEnum.NORMAL));

        if (feedback == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "反馈不存在");
        }

        List<SysFileVO> files = sysAttachmentService.getFiles(AttachmentBizTypeEnum.FEEDBACK, feedback.getId());
        return convertToDetailVO(feedback, files);
    }

    private String generateFeedbackNo() {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "FB" + time + suffix;
    }

    private SysUserFeedbackVO convertToVO(SysUserFeedback feedback) {
        return new SysUserFeedbackVO(
                feedback.getId(),
                feedback.getFeedbackNo(),
                feedback.getType(),
                feedback.getTitle(),
                feedback.getContent(),
                feedback.getStatus(),
                feedback.getCreateTime());
    }

    private SysUserFeedbackDetailVO convertToDetailVO(SysUserFeedback feedback, List<SysFileVO> files) {
        return new SysUserFeedbackDetailVO(
                feedback.getId(),
                feedback.getFeedbackNo(),
                feedback.getType(),
                feedback.getTitle(),
                feedback.getContent(),
                feedback.getStatus(),
                feedback.getReplyContent(),
                feedback.getReplyTime(),
                files,
                feedback.getCreateTime());
    }
}
