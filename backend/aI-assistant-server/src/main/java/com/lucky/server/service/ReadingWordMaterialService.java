package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.domain.dto.ReadingWordMaterialPageQueryDTO;
import com.lucky.server.domain.entity.ReadingWordMaterial;
import com.lucky.server.domain.vo.ReadingWordMaterialRecordVO;

/**
 * 阅读单词素材服务接口
 * @author shiningCloud2025
 */
public interface ReadingWordMaterialService {

    /**
     * 保存阅读单词素材
     *
     * @param entity 阅读单词素材
     * @return 素材ID
     */
    Long saveMaterial(ReadingWordMaterial entity);

    /**
     * 分页查询阅读单词素材历史
     *
     * @param dto 查询参数
     * @return 阅读单词素材历史分页
     */
    Page<ReadingWordMaterialRecordVO> pageMyMaterialHistory(ReadingWordMaterialPageQueryDTO dto);
}
