package com.lucky.server.service;

import com.lucky.server.common.enums.WritingCompositionTutorMessageRoleEnum;
import com.lucky.server.domain.vo.WritingCompositionTutorMessageVO;

import java.util.List;

/**
 * 写作作文AI辅导对话消息服务接口
 * @author shiningCloud2025
 */
public interface WritingCompositionTutorMessageService {

    /**
     * 保存写作作文AI辅导对话消息。
     * Agent 调用链存在异步线程切换，保存消息时必须显式传入用户ID，不能在保存方法内依赖当前线程上下文。
     *
     * @param userId       用户ID
     * @param evaluationId 作文评阅记录ID
     * @param role         消息角色
     * @param content      消息内容
     * @param imageUrls    图片URL列表
     */
    void saveMessage(Long userId,
                     Long evaluationId,
                     WritingCompositionTutorMessageRoleEnum role,
                     String content,
                     List<String> imageUrls);

    /**
     * 查询当前用户某次作文评阅下的AI辅导对话消息。
     *
     * @param evaluationId 作文评阅记录ID
     * @return 对话消息列表
     */
    List<WritingCompositionTutorMessageVO> listMessages(Long evaluationId);
}
