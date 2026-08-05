package com.lucky.server.service.impl;

import com.lucky.server.config.AsrModelConfig;
import com.lucky.server.config.LlmModelConfig;
import com.lucky.server.service.SysUserAiModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 系统用户AI模型服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SysUserAiModelServiceImpl implements SysUserAiModelService {

    private final AsrModelConfig asrModelConfig;
    private final LlmModelConfig llmModelConfig;

    // ==================== ASR ====================

    @Override
    public List<Map<String, String>> getAsrProviders() {
        return asrModelConfig.getProviders().entrySet().stream()
                .map(e -> Map.of("key", e.getKey(), "name", e.getValue().getName()))
                .collect(Collectors.toList());
    }

    @Override
    public List<AsrModelConfig.ModelInfo> getAsrModels(String provider) {
        if (provider == null || provider.isBlank()) {
            return asrModelConfig.getRecommend().stream()
                    .map(this::findAsrModel)
                    .collect(Collectors.toList());
        }
        AsrModelConfig.ProviderInfo p = asrModelConfig.getProviders().get(provider);
        return p != null ? p.getModels() : List.of();
    }

    private AsrModelConfig.ModelInfo findAsrModel(String name) {
        for (AsrModelConfig.ProviderInfo p : asrModelConfig.getProviders().values()) {
            for (AsrModelConfig.ModelInfo m : p.getModels()) {
                if (m.getName().equals(name)) return m;
            }
        }
        return null;
    }

    // ==================== LLM ====================

    @Override
    public List<Map<String, String>> getLlmProviders() {
        return llmModelConfig.getProviders().entrySet().stream()
                .map(e -> Map.of("key", e.getKey(), "name", e.getValue().getName()))
                .collect(Collectors.toList());
    }

    @Override
    public List<LlmModelConfig.ModelInfo> getLlmModels(String provider) {
        if (provider == null || provider.isBlank()) {
            return llmModelConfig.getRecommend().stream()
                    .map(this::findLlmModel)
                    .collect(Collectors.toList());
        }
        LlmModelConfig.ProviderInfo p = llmModelConfig.getProviders().get(provider);
        return p != null ? p.getModels() : List.of();
    }

    private LlmModelConfig.ModelInfo findLlmModel(String name) {
        for (LlmModelConfig.ProviderInfo p : llmModelConfig.getProviders().values()) {
            for (LlmModelConfig.ModelInfo m : p.getModels()) {
                if (m.getName().equals(name)) return m;
            }
        }
        return null;
    }
}
