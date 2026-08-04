package com.lucky.server.service;

import com.lucky.server.domain.dto.SysUserModelPreferenceDTO;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;

import java.util.List;

/**
 * 系统用户模型偏好服务接口
 * @author shiningCloud2025
 */
public interface SysUserModelPreferenceService {

    /** 设置默认模型 */
    void savePreference(SysUserModelPreferenceDTO dto);

    /** 获取当前用户所有偏好 */
    List<SysUserModelPreferenceVO> listPreferences();
}
