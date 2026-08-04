package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.SysUserTermLibrarySaveDTO;
import com.lucky.server.domain.entity.SysUserTermLibrary;
import com.lucky.server.domain.vo.SysUserTermLibraryVO;

import java.util.List;

/**
 * 系统用户术语库 Service 接口
 * @author shiningCloud2025
 */
public interface SysUserTermLibraryService extends IService<SysUserTermLibrary> {

    /**
     * 获取用户全部术语库列表（含条目数量）
     */
    List<SysUserTermLibraryVO> listByUserId();

    /**
     * 创建术语库
     */
    SysUserTermLibraryVO create(SysUserTermLibrarySaveDTO dto);

    /**
     * 修改术语库
     */
    SysUserTermLibraryVO update(Long id, SysUserTermLibrarySaveDTO dto);

    /**
     * 删除术语库（级联删除其下所有条目）
     */
    void delete(Long id);
}
