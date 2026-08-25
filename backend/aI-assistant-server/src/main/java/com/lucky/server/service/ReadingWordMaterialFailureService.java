package com.lucky.server.service;

import com.lucky.server.domain.entity.ReadingWordMaterialFailure;

/**
 * 阅读单词素材失败记录服务接口
 * @author shiningCloud2025
 */
public interface ReadingWordMaterialFailureService {

    /**
     * 保存阅读单词素材失败记录
     *
     * @param entity 失败记录
     * @return 失败记录ID
     */
    Long saveFailure(ReadingWordMaterialFailure entity);
}
