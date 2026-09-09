package com.lucky.server.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 超管日志看板配置
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties(prefix = "super-admin.log")
public class SuperAdminLogProperties {

    /**
     * 日志目录。
     */
    private String path = "logs";

    /**
     * 当前活跃日志文件名。
     */
    private String currentFileName = "my-application.log";

    /**
     * 全量读取允许的最大文件大小，单位字节。
     */
    private Long maxReadBytes = 500 * 1024 * 1024L;

    /**
     * 默认读取尾部行数。
     */
    private Integer defaultTail = 1000;

    /**
     * 最大读取尾部行数。
     */
    private Integer maxTail = 200000;
}