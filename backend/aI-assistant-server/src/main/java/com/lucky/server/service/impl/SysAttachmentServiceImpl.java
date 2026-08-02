package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.enums.AttachmentBizTypeEnum;
import com.lucky.server.domain.entity.SysAttachment;
import com.lucky.server.domain.entity.SysFile;
import com.lucky.server.domain.vo.SysFileVO;
import com.lucky.server.mapper.SysAttachmentMapper;
import com.lucky.server.service.SysAttachmentService;
import com.lucky.server.service.SysFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 业务附件关联 Service 实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SysAttachmentServiceImpl extends ServiceImpl<SysAttachmentMapper, SysAttachment> implements SysAttachmentService {

    private final SysFileService sysFileService;

    @Override
    public void bind(AttachmentBizTypeEnum bizType, Long bizId, List<Long> fileIds) {
        if (CollectionUtils.isEmpty(fileIds)) {
            return;
        }

        List<SysAttachment> attachments = fileIds.stream()
                .map(fileId -> {
                    SysAttachment attachment = new SysAttachment();
                    attachment.setFileId(fileId);
                    attachment.setBizType(bizType);
                    attachment.setBizId(bizId);
                    attachment.setCreateTime(LocalDateTime.now());
                    return attachment;
                })
                .toList();

        saveBatch(attachments);
    }

    @Override
    public List<SysFileVO> getFiles(AttachmentBizTypeEnum bizType, Long bizId) {
        List<SysAttachment> attachments = list(
                new LambdaQueryWrapper<SysAttachment>()
                        .eq(SysAttachment::getBizType, bizType)
                        .eq(SysAttachment::getBizId, bizId));

        if (attachments.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> fileIds = attachments.stream()
                .map(SysAttachment::getFileId)
                .collect(Collectors.toList());

        return sysFileService.listByIds(fileIds).stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByBiz(AttachmentBizTypeEnum bizType, Long bizId) {
        List<SysAttachment> attachments = list(
                new LambdaQueryWrapper<SysAttachment>()
                        .eq(SysAttachment::getBizType, bizType)
                        .eq(SysAttachment::getBizId, bizId));

        if (attachments.isEmpty()) {
            return;
        }

        List<Long> fileIds = attachments.stream()
                .map(SysAttachment::getFileId)
                .collect(Collectors.toList());

        fileIds.forEach(sysFileService::delete);

        removeByIds(attachments.stream()
                .map(SysAttachment::getId)
                .collect(Collectors.toList()));
    }

    private SysFileVO convertToVO(SysFile sysFile) {
        return new SysFileVO(
                sysFile.getId(),
                sysFile.getUrl(),
                sysFile.getFileName(),
                sysFile.getFileSize(),
                sysFile.getMimeType(),
                sysFile.getFileType());
    }
}