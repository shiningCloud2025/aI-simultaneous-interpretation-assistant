package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.domain.dto.MailMessagePageDTO;
import com.lucky.server.domain.vo.MailFolderVO;
import com.lucky.server.domain.vo.MailMessageSummaryVO;

import java.util.List;

/**
 * 邮箱空间服务接口
 * @author shiningCloud2025
 */
public interface MailSpaceService {

    /** 查询邮箱文件夹列表 */
    List<MailFolderVO> listFolders(Long mailAccountId);

    /** 分页查询邮件列表 */
    Page<MailMessageSummaryVO> pageMessages(Long mailAccountId, MailMessagePageDTO dto);
}
