package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.conditions.query.LambdaQueryChainWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.dto.SysUserModelPreferenceDTO;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.entity.SysUserModelPreference;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.mapper.SysUserApiKeyMapper;
import com.lucky.server.mapper.SysUserModelPreferenceMapper;
import com.lucky.server.service.SysUserModelPreferenceService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 系统用户模型偏好服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SysUserModelPreferenceServiceImpl extends ServiceImpl<SysUserModelPreferenceMapper, SysUserModelPreference> implements SysUserModelPreferenceService {

    private final SysUserService sysUserService;
    private final SysUserApiKeyMapper sysUserApiKeyMapper;

    @Override
    public void savePreference(SysUserModelPreferenceDTO dto) {
        Long userId = sysUserService.getCurrentUser().getId();
        ApiKeyTypeEnum modelType = ApiKeyTypeEnum.fromCode(dto.modelType());

        // 校验该厂商+类型有可用 Key
        Long count = new LambdaQueryChainWrapper<>(sysUserApiKeyMapper)
                .eq(SysUserApiKey::getUserId, userId)
                .eq(SysUserApiKey::getProvider, dto.provider())
                .eq(SysUserApiKey::getKeyType, modelType)
                .eq(SysUserApiKey::getStatus, 1)
                .eq(SysUserApiKey::getDeleted, DeletedStatusEnum.NORMAL)
                .count();
        if (count == 0) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先配置" + dto.provider() + "的可用API Key");
        }

        // 存在则更新，否则新增
        SysUserModelPreference exist = lambdaQuery()
                .eq(SysUserModelPreference::getUserId, userId)
                .eq(SysUserModelPreference::getModelType, modelType)
                .eq(SysUserModelPreference::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (exist != null) {
            lambdaUpdate().eq(SysUserModelPreference::getId, exist.getId())
                    .set(SysUserModelPreference::getProvider, dto.provider())
                    .set(SysUserModelPreference::getModelName, dto.modelName())
                    .set(SysUserModelPreference::getUpdateTime, LocalDateTime.now())
                    .update();
        } else {
            SysUserModelPreference entity = new SysUserModelPreference();
            entity.setUserId(userId);
            entity.setModelType(modelType);
            entity.setProvider(dto.provider());
            entity.setModelName(dto.modelName());
            entity.setDeleted(DeletedStatusEnum.NORMAL);
            entity.setCreateTime(LocalDateTime.now());
            entity.setUpdateTime(LocalDateTime.now());
            save(entity);
        }
    }

    @Override
    public List<SysUserModelPreferenceVO> listPreferences() {
        Long userId = sysUserService.getCurrentUser().getId();
        return lambdaQuery()
                .eq(SysUserModelPreference::getUserId, userId)
                .eq(SysUserModelPreference::getDeleted, DeletedStatusEnum.NORMAL)
                .list()
                .stream()
                .map(SysUserModelPreferenceVO::from)
                .toList();
    }
}
