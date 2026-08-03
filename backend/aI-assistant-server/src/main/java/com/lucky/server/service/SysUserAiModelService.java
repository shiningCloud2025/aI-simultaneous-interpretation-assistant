package com.lucky.server.service;

import com.lucky.server.config.AsrModelConfig;
import com.lucky.server.config.LlmModelConfig;

import java.util.List;
import java.util.Map;

/**
 * 系统用户AI模型服务接口
 * @author shiningCloud2025
 */
public interface SysUserAiModelService {

    /** 获取ASR厂商列表 */
    List<Map<String, String>> getAsrProviders();

    /** 获取ASR模型：不传provider返回推荐，传了返回该厂商全部 */
    List<AsrModelConfig.ModelInfo> getAsrModels(String provider);

    /** 获取LLM厂商列表 */
    List<Map<String, String>> getLlmProviders();

    /** 获取LLM模型：不传provider返回推荐，传了返回该厂商全部 */
    List<LlmModelConfig.ModelInfo> getLlmModels(String provider);
}
