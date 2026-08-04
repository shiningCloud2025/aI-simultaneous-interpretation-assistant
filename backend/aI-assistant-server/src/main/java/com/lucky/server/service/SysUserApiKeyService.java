package com.lucky.server.service;

import com.lucky.server.domain.dto.SysUserApiKeyDTO;
import com.lucky.server.domain.entity.SysUserApiKey;

import java.util.List;

/**
 * 系统用户API Key服务接口
 * @author shiningCloud2025
 */
public interface SysUserApiKeyService {

    /** 配置/更新 API Key */
    void saveApiKey(SysUserApiKeyDTO dto);

    /** 查看当前用户所有 API Key */
    List<SysUserApiKey> listApiKeys();

    /** 删除 API Key */
    void deleteApiKey(Long id);

    /** 测试连通性 */
    void testApiKey(Long id);
}
