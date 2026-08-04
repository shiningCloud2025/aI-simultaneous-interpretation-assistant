package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.SysUserTermEntrySaveDTO.EntryItem;
import com.lucky.server.domain.entity.SysUserTermEntry;
import com.lucky.server.domain.vo.SysUserTermEntryVO;

import java.util.List;

/**
 * 系统用户术语条目 Service 接口
 * @author shiningCloud2025
 */
public interface SysUserTermEntryService extends IService<SysUserTermEntry> {

    /**
     * 根据术语库ID获取全部条目
     */
    List<SysUserTermEntryVO> listByLibraryId(Long libraryId);

    /**
     * 批量新增/修改术语条目
     * 全量覆盖：前端传什么就存什么，不传的等同于删除
     */
    void batchSaveOrUpdate(Long libraryId, List<EntryItem> dtos);
}
