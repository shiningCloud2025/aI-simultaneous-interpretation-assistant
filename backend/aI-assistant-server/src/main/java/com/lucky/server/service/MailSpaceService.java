package com.lucky.server.service;

import com.lucky.server.domain.vo.MailFolderVO;

import java.util.List;

/**
 * 邮箱空间服务接口
 * @author shiningCloud2025
 */
public interface MailSpaceService {

    /** 查询邮箱文件夹列表 */
    List<MailFolderVO> listFolders(Long mailAccountId);
}
