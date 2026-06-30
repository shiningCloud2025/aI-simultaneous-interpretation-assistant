package com.lucky.server.model.provider;


import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties
public class ProviderModelConfig {

    private Map<String,Provider> provider = Map.of();


    @Data
    public static class Provider{
        // 模型类型
        private String type;
        // 模型ApiKey
        private String apiKey;
        // 模型BaseUrl
        private String baseUrl;
        // 文本模型列表
        private List<String> text = new LinkedList<>();
        // 语音模型列表
        private List<String> audio = new LinkedList<>();
        // 视觉模型列表
        private List<String> vision = new LinkedList<>();

    }

}
