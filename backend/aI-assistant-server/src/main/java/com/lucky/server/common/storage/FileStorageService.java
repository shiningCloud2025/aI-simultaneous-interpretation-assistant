package com.lucky.server.common.storage;

import java.io.InputStream;

/**
 * 通用文件存储接口
 * @author shiningCloud2025
 */
public interface FileStorageService {

    /**
     * 上传文件
     * @param fileName 文件名
     * @param inputStream 文件输入流
     * @param size 文件大小（字节）
     * @param contentType MIME 类型
     * @return 文件访问 URL
     */
    String upload(String fileName, InputStream inputStream, long size, String contentType);

    /**
     * 根据 URL 删除文件
     * @param url 文件访问 URL
     */
    void delete(String url);
}