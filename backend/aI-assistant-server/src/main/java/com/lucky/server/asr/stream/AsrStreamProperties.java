package com.lucky.server.asr.stream;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ASR-Stream相关的配置数据
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties(prefix = "asr")
public class AsrStreamProperties {
    private Category stream = new Category();

    @Data
    public static class Category{
        private List<String> recomment = new ArrayList<>();
        private Map<String, Provider>  providers = Map.of();
    }

    @Data
    public static class Provider {
        private String name;
        private List<Model> models = new ArrayList<>();
    }

    @Data
    public static class Model{
        private String name;
        private String display;
        private List<String> languages = new ArrayList<>();
    }

}
