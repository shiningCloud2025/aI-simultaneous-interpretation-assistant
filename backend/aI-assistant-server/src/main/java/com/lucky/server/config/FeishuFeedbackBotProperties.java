package com.lucky.server.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 飞书反馈机器人配置
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties(prefix = "feishu.feedback")
public class FeishuFeedbackBotProperties {

    /**
     * 是否开启飞书反馈通知。
     */
    private Boolean enabled = false;

    /**
     * 飞书自定义机器人 webhook 地址。
     */
    private String webhookUrl;

    /**
     * 飞书自定义机器人签名密钥。
     */
    private String secret;
}