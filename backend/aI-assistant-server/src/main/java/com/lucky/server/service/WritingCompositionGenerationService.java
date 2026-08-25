package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.domain.dto.WritingCompositionGenerationPageQueryDTO;
import com.lucky.server.domain.entity.WritingCompositionGeneration;
import com.lucky.server.domain.vo.WritingCompositionGenerationRecordVO;

/**
 * 写作作文生成记录服务接口
 * @author shiningCloud2025
 */
public interface WritingCompositionGenerationService {

    /**
     * 保存生成成功记录
     *
     * @param entity 生成记录
     * @return 生成记录ID
     */
    Long saveGeneration(WritingCompositionGeneration entity);

    /**
     * 查询正常生成记录
     *
     * @param id 主键ID
     * @return 生成记录
     */
    WritingCompositionGeneration getNormalById(Long id);

    /**
     * 分页查询当前用户作文生成历史
     *
     * @param dto 查询参数
     * @return 作文生成历史分页
     */
    Page<WritingCompositionGenerationRecordVO> pageMyGenerationHistory(WritingCompositionGenerationPageQueryDTO dto);
}
