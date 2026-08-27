package com.lucky.server.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 阅读单词图片生成配置
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties(prefix = "reading.word.image")
public class ReadingWordImageProperties {

    /** 厂商标识 */
    private String provider = "alibaba";

    /** 图片生成模型 */
    private String model = "wan2.6-t2i";

    /** 图片生成接口地址 */
    private String endpoint;

    /** 图片生成 API Key */
    private String apiKey;

    /** 图片尺寸 */
    private String size = "1280*1280";

    /** 是否开启提示词扩展 */
    private boolean promptExtend = true;

    /** 是否添加水印 */
    private boolean watermark = false;
}