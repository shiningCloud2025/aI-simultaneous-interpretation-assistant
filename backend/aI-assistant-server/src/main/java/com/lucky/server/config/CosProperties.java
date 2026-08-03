package com.lucky.server.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 腾讯云 COS 配置属性
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties(prefix = "storage.tencent.cos")
public class CosProperties {

    /** 腾讯云 SecretId */
    private String secretId;

    /** 腾讯云 SecretKey */
    private String secretKey;

    /** 存储桶地域，如 ap-shanghai */
    private String region;

    /** 存储桶名称 */
    private String bucketName;

    /** 访问域名，默认域名或自定义 CDN 域名 */
    private String domain;
}