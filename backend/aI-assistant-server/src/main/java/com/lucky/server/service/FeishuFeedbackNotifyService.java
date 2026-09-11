package com.lucky.server.service;

import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.entity.SysUserFeedback;

/**
 * 飞书反馈通知服务
 * @author shiningCloud2025
 */
public interface FeishuFeedbackNotifyService {

    /**
     * 发送新反馈通知。
     * 通知失败不能影响用户反馈提交主流程。
     *
     * @param feedback 反馈信息
     * @param user     提交反馈的用户
     */
    void notifyNewFeedback(SysUserFeedback feedback, SysUser user);
}