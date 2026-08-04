package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.tester.LlmApiKeyTester;
import com.lucky.server.config.LlmModelConfig;
import com.lucky.server.domain.dto.SysUserApiKeyDTO;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.mapper.SysUserApiKeyMapper;
import com.lucky.server.service.SysUserApiKeyService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 系统用户API Key服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SysUserApiKeyServiceImpl extends ServiceImpl<SysUserApiKeyMapper, SysUserApiKey> implements SysUserApiKeyService {

    private final SysUserService sysUserService;
    private final LlmApiKeyTester llmApiKeyTester;
    private final LlmModelConfig llmModelConfig;

    @Override
    public void saveApiKey(SysUserApiKeyDTO dto) {
        Long userId = sysUserService.getCurrentUser().getId();
        ApiKeyTypeEnum keyType = ApiKeyTypeEnum.fromCode(dto.keyType());

        // 检查是否已存在，存在则更新
        SysUserApiKey exist = lambdaQuery()
                .eq(SysUserApiKey::getUserId, userId)
                .eq(SysUserApiKey::getProvider, dto.provider())
                .eq(SysUserApiKey::getKeyType, keyType)
                .eq(SysUserApiKey::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (exist != null) {
            lambdaUpdate().eq(SysUserApiKey::getId, exist.getId())
                    .set(SysUserApiKey::getApiKey, dto.apiKey())
                    .set(SysUserApiKey::getStatus, 0)
                    .set(SysUserApiKey::getUpdateTime, LocalDateTime.now())
                    .update();
        } else {
            SysUserApiKey entity = new SysUserApiKey();
            entity.setUserId(userId);
            entity.setProvider(dto.provider());
            entity.setKeyType(keyType);
            entity.setApiKey(dto.apiKey());
            entity.setStatus(0);
            entity.setDeleted(DeletedStatusEnum.NORMAL);
            entity.setCreateTime(LocalDateTime.now());
            entity.setUpdateTime(LocalDateTime.now());
            save(entity);
        }
    }

    @Override
    public List<SysUserApiKey> listApiKeys() {
        Long userId = sysUserService.getCurrentUser().getId();
        return lambdaQuery()
                .eq(SysUserApiKey::getUserId, userId)
                .eq(SysUserApiKey::getDeleted, DeletedStatusEnum.NORMAL)
                .list();
    }

    @Override
    public void deleteApiKey(Long id) {
        SysUserApiKey entity = lambdaQuery()
                .eq(SysUserApiKey::getId, id)
                .eq(SysUserApiKey::getDeleted, DeletedStatusEnum.NORMAL)
                .one();
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "API Key不存在");
        }
        lambdaUpdate().eq(SysUserApiKey::getId, id)
                .set(SysUserApiKey::getDeleted, DeletedStatusEnum.DELETED)
                .set(SysUserApiKey::getUpdateTime, LocalDateTime.now())
                .update();
    }

    @Override
    public void testApiKey(Long id) {
        SysUserApiKey entity = lambdaQuery()
                .eq(SysUserApiKey::getId, id)
                .eq(SysUserApiKey::getDeleted, DeletedStatusEnum.NORMAL)
                .one();
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "API Key不存在");
        }

        boolean success;
        if (entity.getKeyType() == ApiKeyTypeEnum.LLM) {
            LlmModelConfig.ProviderInfo provider = llmModelConfig.getProviders().get(entity.getProvider());
            if (provider == null) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的厂商: " + entity.getProvider());
            }
            success = llmApiKeyTester.test(provider.getEndpoint(), entity.getApiKey(), provider.getTestModel());
        } else {
            // ASR 暂不实现真实测试，直接标可用
            success = true;
        }

        lambdaUpdate().eq(SysUserApiKey::getId, id)
                .set(SysUserApiKey::getStatus, success ? 1 : 2)
                .set(SysUserApiKey::getLastTestTime, LocalDateTime.now())
                .update();
    }
}
