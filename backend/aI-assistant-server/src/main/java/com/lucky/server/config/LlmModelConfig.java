package com.lucky.server.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * LLM模型配置
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties(prefix = "ai.llm")
public class LlmModelConfig {

    private List<String> recommend;
    private Map<String, ProviderInfo> providers;

    @Data
    public static class ProviderInfo {
        private String name;
        private String endpoint;
        private String testModel;
        private List<ModelInfo> models;
    }

    @Data
    public static class ModelInfo {
        private String name;
        private String display;
        private List<String> inputs;
    }
}
