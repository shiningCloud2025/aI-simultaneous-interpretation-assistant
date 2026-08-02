package com.lucky.server.service;

import com.lucky.server.domain.entity.SysFile;
import com.lucky.server.domain.vo.SysFileVO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 文件 Service 接口
 * @author shiningCloud2025
 */
public interface SysFileService {

    /**
     * 上传文件
     * @param file 上传文件
     * @return 文件信息
     */
    SysFileVO upload(MultipartFile file);

    /**
     * 删除文件
     * @param fileId 文件ID
     */
    void delete(Long fileId);

    /**
     * 根据ID列表查询文件
     * @param ids 文件ID列表
     * @return 文件列表
     */
    List<SysFile> listByIds(List<Long> ids);
}