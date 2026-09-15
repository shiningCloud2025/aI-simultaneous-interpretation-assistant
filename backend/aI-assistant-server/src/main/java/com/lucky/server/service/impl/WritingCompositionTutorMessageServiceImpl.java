package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.WritingCompositionTutorMessageRoleEnum;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.entity.WritingCompositionEvaluation;
import com.lucky.server.domain.entity.WritingCompositionTutorMessage;
import com.lucky.server.domain.vo.WritingCompositionTutorMessageVO;
import com.lucky.server.mapper.WritingCompositionEvaluationMapper;
import com.lucky.server.mapper.WritingCompositionTutorMessageMapper;
import com.lucky.server.service.SysUserService;
import com.lucky.server.service.WritingCompositionTutorMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * 写作作文AI辅导对话消息服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class WritingCompositionTutorMessageServiceImpl
        extends ServiceImpl<WritingCompositionTutorMessageMapper, WritingCompositionTutorMessage>
        implements WritingCompositionTutorMessageService {

    private final SysUserService sysUserService;
    private final WritingCompositionEvaluationMapper writingCompositionEvaluationMapper;
    private final ObjectMapper objectMapper;

    @Override
    public void saveMessage(Long userId,
                            Long evaluationId,
                            WritingCompositionTutorMessageRoleEnum role,
                            String content,
                            List<String> imageUrls) {
        if (userId == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "用户ID不能为空");
        }
        if (role == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "消息角色不能为空");
        }
        if (!StringUtils.hasText(content)) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "消息内容不能为空");
        }
        validateImageUrls(imageUrls);
        checkEvaluation(evaluationId, userId);

        LocalDateTime now = LocalDateTime.now();

        WritingCompositionTutorMessage message = new WritingCompositionTutorMessage();
        message.setUserId(userId);
        message.setEvaluationId(evaluationId);
        message.setRole(role);
        message.setContent(content);
        message.setImageUrlsJson(toJson(imageUrls));
        message.setCreateBy(String.valueOf(userId));
        message.setCreateTime(now);
        message.setUpdateBy(String.valueOf(userId));
        message.setUpdateTime(now);
        message.setDeleted(DeletedStatusEnum.NORMAL);

        save(message);
    }

    @Override
    public List<WritingCompositionTutorMessageVO> listMessages(Long evaluationId) {
        SysUser currentUser = sysUserService.getCurrentUser();
        checkEvaluation(evaluationId, currentUser.getId());

        return list(new LambdaQueryWrapper<WritingCompositionTutorMessage>()
                .eq(WritingCompositionTutorMessage::getUserId, currentUser.getId())
                .eq(WritingCompositionTutorMessage::getEvaluationId, evaluationId)
                .eq(WritingCompositionTutorMessage::getDeleted, DeletedStatusEnum.NORMAL)
                .orderByAsc(WritingCompositionTutorMessage::getCreateTime)
                .orderByAsc(WritingCompositionTutorMessage::getId))
                .stream()
                .map(this::toVO)
                .toList();
    }

    /**
     * 校验作文评阅记录归属指定用户，避免异步落库或查询时越权访问其他用户数据。
     */
    private void checkEvaluation(Long evaluationId, Long userId) {
        if (evaluationId == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "作文评阅记录ID不能为空");
        }

        WritingCompositionEvaluation evaluation = writingCompositionEvaluationMapper.selectById(evaluationId);
        if (evaluation == null
                || !userId.equals(evaluation.getUserId())
                || !DeletedStatusEnum.NORMAL.equals(evaluation.getDeleted())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "作文评阅记录不存在");
        }
    }

    /**
     * 校验提问图片URL，避免保存空URL导致前端回显异常。
     */
    private void validateImageUrls(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }
        boolean hasBlankUrl = imageUrls.stream().anyMatch(url -> !StringUtils.hasText(url));
        if (hasBlankUrl) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "提问图片URL不能为空");
        }
    }

    /**
     * 转换对话消息视图。
     */
    private WritingCompositionTutorMessageVO toVO(WritingCompositionTutorMessage entity) {
        return new WritingCompositionTutorMessageVO(
                entity.getId(),
                entity.getEvaluationId(),
                entity.getRole(),
                entity.getRole() == null ? null : entity.getRole().getDesc(),
                entity.getContent(),
                parseImageUrls(entity.getImageUrlsJson()),
                entity.getCreateTime()
        );
    }

    /**
     * 序列化图片URL列表。
     */
    private String toJson(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(imageUrls);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "图片URL列表序列化失败");
        }
    }

    /**
     * 解析图片URL列表JSON。
     */
    private List<String> parseImageUrls(String json) {
        if (!StringUtils.hasText(json)) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
