package com.lucky.server.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 口语跟读评测配置
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties(prefix = "speaking.evaluation")
public class SpeakingEvaluationProperties {

    /** 厂商标识 */
    private String provider = "tencent";

    /** 腾讯云 AppID */
    private String appId;

    /** 腾讯云 SecretId */
    private String secretId;

    /** 腾讯云 SecretKey */
    private String secretKey;

    /** 临时密钥 Token，永久密钥可为空 */
    private String token;

    /** 评测引擎类型 */
    private String serverEngineType = "16k_en";

    /** 评测模式：1表示句子模式 */
    private Integer evalMode = 1;

    /** 评分苛刻系数 */
    private Double scoreCoeff = 3.0;

    /** 音频格式：1表示wav，2表示mp3 */
    private Integer voiceFormat = 1;

    /** 识别模式：1表示录音识别 */
    private Integer recMode = 1;

    /** 是否返回句子/单词明细 */
    private Integer sentenceInfoEnabled = 1;

    /** 评测超时时间 */
    private Long timeoutMillis = 60000L;
}