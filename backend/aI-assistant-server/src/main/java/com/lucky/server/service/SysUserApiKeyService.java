package com.lucky.server.service;

import com.lucky.server.domain.dto.SysUserApiKeyDTO;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.vo.SysUserApiKeyVO;

import java.util.List;

/**
 * 系统用户API Key服务接口
 * @author shiningCloud2025
 */
public interface SysUserApiKeyService {

    /** 配置/更新 API Key */
    void saveApiKey(SysUserApiKeyDTO dto);

    /** 查看当前用户所有 API Key */
    List<SysUserApiKeyVO> listApiKeys();

    /** 删除 API Key */
    void deleteApiKey(Long id);

    /** 测试连通性 */
    void testApiKey(Long id);

    /**
     * 获取当前用户可用的 LLM API Key（真实Key，仅内部使用）
     *
     * @return API Key 实体，如果没有可用 Key 返回 null
     */
    SysUserApiKey getAvailableLlmKey(String provider);


}
