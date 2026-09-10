package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.domain.dto.SpeakingMaterialPageQueryDTO;
import com.lucky.server.domain.entity.SpeakingMaterialGeneration;
import com.lucky.server.domain.vo.SpeakingMaterialRecordVO;

/**
 * 口语素材生成记录服务接口
 * @author shiningCloud2025
 */
public interface SpeakingMaterialGenerationService {

    /**
     * 保存口语素材生成记录
     *
     * @param entity 口语素材生成记录
     * @return 口语素材生成记录ID
     */
    Long saveGeneration(SpeakingMaterialGeneration entity);

    /**
     * 分页查询当前用户口语素材历史
     *
     * @param dto 查询参数
     * @return 口语素材历史分页
     */
    Page<SpeakingMaterialRecordVO> pageMyMaterialHistory(SpeakingMaterialPageQueryDTO dto);
}
