package com.lucky.server.service;

import com.lucky.server.common.enums.AttachmentBizTypeEnum;
import com.lucky.server.domain.vo.SysFileVO;

import java.util.List;

/**
 * 业务附件关联 Service 接口
 * @author shiningCloud2025
 */
public interface SysAttachmentService {

    void bind(AttachmentBizTypeEnum bizType, Long bizId, List<Long> fileIds);

    List<SysFileVO> getFiles(AttachmentBizTypeEnum bizType, Long bizId);

    void deleteByBiz(AttachmentBizTypeEnum bizType, Long bizId);
}