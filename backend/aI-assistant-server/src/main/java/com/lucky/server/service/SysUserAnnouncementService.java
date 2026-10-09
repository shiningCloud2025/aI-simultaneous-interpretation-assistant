package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.AnnouncementPageQueryDTO;
import com.lucky.server.domain.entity.SysAnnouncement;
import com.lucky.server.domain.vo.AnnouncementDetailVO;
import com.lucky.server.domain.vo.AnnouncementListVO;

/**
 * 用户公告服务
 * @author shiningCloud2025
 */
public interface SysUserAnnouncementService extends IService<SysAnnouncement> {

    /**
     * 查询当前用户最新未读公告。
     * 仅检查最新发布公告：如果最新公告已读，则不再主动推送旧公告。
     */
    AnnouncementDetailVO latestUnread();

    /**
     * 标记公告为已读。
     */
    void read(Long id);

    /**
     * 分页查询已发布公告。
     */
    Page<AnnouncementListVO> pageAnnouncements(AnnouncementPageQueryDTO dto);

    /**
     * 查询已发布公告详情。
     */
    AnnouncementDetailVO detail(Long id);
}
