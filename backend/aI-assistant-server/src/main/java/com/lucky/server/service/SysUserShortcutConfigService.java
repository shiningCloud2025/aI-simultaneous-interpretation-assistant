package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.SysUserShortcutConfigSaveDTO.ShortcutItem;
import com.lucky.server.domain.entity.SysUserShortcutConfig;
import com.lucky.server.domain.vo.SysUserShortcutConfigVO;

import java.util.List;

/**
 * 系统用户快捷键配置 Service 接口
 * @author shiningCloud2025
 */
public interface SysUserShortcutConfigService extends IService<SysUserShortcutConfig> {

    /**
     * 获取用户全部快捷键配置
     */
    List<SysUserShortcutConfigVO> listByUserId();

    /**
     * 批量新增/修改快捷键配置
     * 全量覆盖：前端传什么就存什么，不传的等同于删除
     */
    void batchSaveOrUpdate(List<ShortcutItem> dtos);
}
