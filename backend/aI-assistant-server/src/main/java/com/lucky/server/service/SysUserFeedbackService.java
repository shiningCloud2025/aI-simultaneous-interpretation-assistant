package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.domain.dto.FeedbackPageQueryDTO;
import com.lucky.server.domain.dto.SysUserFeedbackSubmitDTO;
import com.lucky.server.domain.vo.SysUserFeedbackDetailVO;
import com.lucky.server.domain.vo.SysUserFeedbackVO;

/**
 * 用户反馈 Service 接口
 * @author shiningCloud2025
 */
public interface SysUserFeedbackService {

    /**
     * 提交反馈
     * @param dto 反馈信息
     */
    void submit(SysUserFeedbackSubmitDTO dto);

    /**
     * 分页查询当前用户的反馈列表
     * @param dto 分页查询参数
     * @return 分页结果
     */
    Page<SysUserFeedbackVO> pageMyFeedback(FeedbackPageQueryDTO dto);

    /**
     * 查询反馈详情
     * @param id 反馈ID
     * @return 详情
     */
    SysUserFeedbackDetailVO detail(Long id);
}
