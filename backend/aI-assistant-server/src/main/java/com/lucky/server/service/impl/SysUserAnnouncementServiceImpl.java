package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.AnnouncementStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.dto.AnnouncementPageQueryDTO;
import com.lucky.server.domain.entity.SysAnnouncement;
import com.lucky.server.domain.entity.SysAnnouncementUserRead;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.AnnouncementDetailVO;
import com.lucky.server.domain.vo.AnnouncementListVO;
import com.lucky.server.mapper.SysAnnouncementMapper;
import com.lucky.server.mapper.SysAnnouncementUserReadMapper;
import com.lucky.server.service.SysUserAnnouncementService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 用户公告服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SysUserAnnouncementServiceImpl extends ServiceImpl<SysAnnouncementMapper, SysAnnouncement> implements SysUserAnnouncementService {

    private final SysAnnouncementUserReadMapper sysAnnouncementUserReadMapper;
    private final SysUserService sysUserService;

    @Override
    public AnnouncementDetailVO latestUnread() {
        Long userId = currentUserId();

        SysAnnouncement latest = lambdaQuery()
                .eq(SysAnnouncement::getDeleted, DeletedStatusEnum.NORMAL)
                .eq(SysAnnouncement::getStatus, AnnouncementStatusEnum.PUBLISHED)
                .orderByDesc(SysAnnouncement::getPublishTime)
                .orderByDesc(SysAnnouncement::getCreateTime)
                .last("LIMIT 1")
                .one();

        if (latest == null || hasRead(latest.getId(), userId)) {
            return null;
        }

        return AnnouncementDetailVO.from(latest, false);
    }

    @Override
    public void read(Long id) {
        Long userId = currentUserId();
        SysAnnouncement announcement = getPublishedAnnouncement(id);

        if (hasRead(announcement.getId(), userId)) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        SysAnnouncementUserRead read = new SysAnnouncementUserRead();
        read.setAnnouncementId(announcement.getId());
        read.setUserId(userId);
        read.setReadTime(now);
        read.setCreatedById(userId);
        read.setCreateTime(now);
        read.setUpdatedById(userId);
        read.setUpdateTime(now);
        read.setDeleted(DeletedStatusEnum.NORMAL);
        sysAnnouncementUserReadMapper.insert(read);
    }

    @Override
    public Page<AnnouncementListVO> pageAnnouncements(AnnouncementPageQueryDTO dto) {
        AnnouncementPageQueryDTO.Filter filter = dto.filter();

        LambdaQueryWrapper<SysAnnouncement> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysAnnouncement::getDeleted, DeletedStatusEnum.NORMAL)
                .eq(SysAnnouncement::getStatus, AnnouncementStatusEnum.PUBLISHED);

        if (filter != null && StringUtils.hasText(filter.keyword())) {
            wrapper.like(SysAnnouncement::getTitle, filter.keyword().trim());
        }

        wrapper.orderByDesc(SysAnnouncement::getPublishTime)
                .orderByDesc(SysAnnouncement::getCreateTime);

        Page<SysAnnouncement> page = page(new Page<>(dto.page(), dto.size()), wrapper);
        Set<Long> readAnnouncementIds = readAnnouncementIds(page.getRecords(), currentUserId());

        Page<AnnouncementListVO> result = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        result.setRecords(page.getRecords().stream()
                .map(announcement -> AnnouncementListVO.from(announcement, readAnnouncementIds.contains(announcement.getId())))
                .toList());
        return result;
    }

    @Override
    public AnnouncementDetailVO detail(Long id) {
        Long userId = currentUserId();
        SysAnnouncement announcement = getPublishedAnnouncement(id);
        return AnnouncementDetailVO.from(announcement, hasRead(announcement.getId(), userId));
    }

    private SysAnnouncement getPublishedAnnouncement(Long id) {
        SysAnnouncement announcement = lambdaQuery()
                .eq(SysAnnouncement::getId, id)
                .eq(SysAnnouncement::getDeleted, DeletedStatusEnum.NORMAL)
                .eq(SysAnnouncement::getStatus, AnnouncementStatusEnum.PUBLISHED)
                .one();

        if (announcement == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "公告不存在");
        }

        return announcement;
    }

    private boolean hasRead(Long announcementId, Long userId) {
        Long count = sysAnnouncementUserReadMapper.selectCount(new LambdaQueryWrapper<SysAnnouncementUserRead>()
                .eq(SysAnnouncementUserRead::getAnnouncementId, announcementId)
                .eq(SysAnnouncementUserRead::getUserId, userId)
                .eq(SysAnnouncementUserRead::getDeleted, DeletedStatusEnum.NORMAL));
        return count != null && count > 0;
    }

    private Set<Long> readAnnouncementIds(List<SysAnnouncement> announcements, Long userId) {
        if (CollectionUtils.isEmpty(announcements)) {
            return Collections.emptySet();
        }

        List<Long> announcementIds = announcements.stream()
                .map(SysAnnouncement::getId)
                .toList();

        return sysAnnouncementUserReadMapper.selectList(new LambdaQueryWrapper<SysAnnouncementUserRead>()
                        .in(SysAnnouncementUserRead::getAnnouncementId, announcementIds)
                        .eq(SysAnnouncementUserRead::getUserId, userId)
                        .eq(SysAnnouncementUserRead::getDeleted, DeletedStatusEnum.NORMAL))
                .stream()
                .map(SysAnnouncementUserRead::getAnnouncementId)
                .collect(Collectors.toSet());
    }

    private Long currentUserId() {
        SysUser currentUser = sysUserService.getCurrentUser();
        return currentUser.getId();
    }
}
