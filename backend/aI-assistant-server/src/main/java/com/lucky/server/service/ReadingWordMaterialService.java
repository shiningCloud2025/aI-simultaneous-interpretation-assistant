package com.lucky.server.service;

import com.lucky.server.domain.entity.ReadingWordMaterial;

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
}
