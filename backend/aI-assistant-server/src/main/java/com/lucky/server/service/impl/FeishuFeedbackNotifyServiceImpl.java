package com.lucky.server.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.config.FeishuFeedbackBotProperties;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.entity.SysUserFeedback;
import com.lucky.server.service.FeishuFeedbackNotifyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 飞书反馈通知服务实现
 * @author shiningCloud2025
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FeishuFeedbackNotifyServiceImpl implements FeishuFeedbackNotifyService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int CONTENT_MAX_LENGTH = 800;

    private final FeishuFeedbackBotProperties feishuFeedbackBotProperties;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public void notifyNewFeedback(SysUserFeedback feedback, SysUser user) {
        if (!Boolean.TRUE.equals(feishuFeedbackBotProperties.getEnabled())) {
            return;
        }

        if (!StringUtils.hasText(feishuFeedbackBotProperties.getWebhookUrl())) {
            log.warn("飞书反馈通知未配置 webhookUrl，feedbackId={}", feedback == null ? null : feedback.getId());
            return;
        }

        try {
            String requestBody = objectMapper.writeValueAsString(buildRequestBody(feedback, user));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(feishuFeedbackBotProperties.getWebhookUrl()))
                    .header("Content-Type", "application/json; charset=utf-8")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("飞书反馈通知发送失败，feedbackId={}, statusCode={}, response={}",
                        feedback.getId(), response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.warn("飞书反馈通知发送异常，feedbackId={}", feedback == null ? null : feedback.getId(), e);
        }
    }

    /**
     * 构造飞书机器人请求体。
     */
    private Map<String, Object> buildRequestBody(SysUserFeedback feedback, SysUser user) throws Exception {
        Map<String, Object> requestBody = new LinkedHashMap<>();

        if (StringUtils.hasText(feishuFeedbackBotProperties.getSecret())) {
            long timestamp = System.currentTimeMillis() / 1000;
            requestBody.put("timestamp", String.valueOf(timestamp));
            requestBody.put("sign", generateSign(timestamp, feishuFeedbackBotProperties.getSecret()));
        }

        requestBody.put("msg_type", "text");
        requestBody.put("content", Map.of("text", buildMessage(feedback, user)));

        return requestBody;
    }

    /**
     * 构造反馈通知文本。
     */
    private String buildMessage(SysUserFeedback feedback, SysUser user) {
        String feedbackType = feedback.getType() == null ? "-" : feedback.getType().getDesc();
        String createTime = feedback.getCreateTime() == null ? "-" : feedback.getCreateTime().format(DATE_TIME_FORMATTER);

        return """
                收到新的用户反馈

                反馈编号：%s
                反馈类型：%s
                反馈标题：%s
                提交用户：%s
                用户账号：%s
                提交时间：%s

                反馈内容：
                %s
                """.formatted(
                blankToPlaceholder(feedback.getFeedbackNo()),
                feedbackType,
                blankToPlaceholder(feedback.getTitle()),
                user == null ? "-" : blankToPlaceholder(user.getUsername()),
                user == null ? "-" : blankToPlaceholder(user.getAccount()),
                createTime,
                truncate(blankToPlaceholder(feedback.getContent()))
        );
    }

    /**
     * 生成飞书自定义机器人签名。
     */
    private String generateSign(long timestamp, String secret) throws Exception {
        String stringToSign = timestamp + "\n" + secret;
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(stringToSign.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getEncoder().encodeToString(mac.doFinal(new byte[]{}));
    }

    private String blankToPlaceholder(String value) {
        return StringUtils.hasText(value) ? value : "-";
    }

    private String truncate(String value) {
        if (value.length() <= CONTENT_MAX_LENGTH) {
            return value;
        }
        return value.substring(0, CONTENT_MAX_LENGTH) + "...";
    }
}