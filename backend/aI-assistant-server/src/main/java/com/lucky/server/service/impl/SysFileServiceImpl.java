package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.storage.FileStorageService;
import com.lucky.server.domain.entity.SysFile;
import com.lucky.server.domain.vo.SysFileVO;
import com.lucky.server.mapper.SysFileMapper;
import com.lucky.server.service.SysFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 文件 Service 实现
 * @author shiningCloud2025
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysFileServiceImpl extends ServiceImpl<SysFileMapper, SysFile> implements SysFileService {

    private static final List<String> ALLOWED_TYPES = List.of("image/png", "image/jpeg", "image/webp", "image/gif");
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5MB

    private final FileStorageService fileStorageService;

    @Override
    public SysFileVO upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "文件不能为空");
        }

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "仅支持 png、jpg、webp、gif 格式图片");
        }

        if (file.getSize() > MAX_SIZE) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "单张图片大小不能超过 5MB");
        }

        String fileName = file.getOriginalFilename();
        String url;
        try {
            url = fileStorageService.upload(
                    fileName,
                    file.getInputStream(),
                    file.getSize(),
                    file.getContentType());
        } catch (IOException e) {
            log.error("[FileService] 读取文件流失败", e);
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "文件读取失败");
        }

        SysFile sysFile = new SysFile();
        sysFile.setUrl(url);
        sysFile.setFileName(fileName);
        sysFile.setFileSize((int) file.getSize());
        sysFile.setMimeType(file.getContentType());
        sysFile.setFileType("image");
        sysFile.setCreateTime(LocalDateTime.now());

        save(sysFile);

        return new SysFileVO(
                sysFile.getId(),
                sysFile.getUrl(),
                sysFile.getFileName(),
                sysFile.getFileSize(),
                sysFile.getMimeType(),
                sysFile.getFileType());
    }

    @Override
    public void delete(Long fileId) {
        SysFile sysFile = getById(fileId);
        if (sysFile == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "文件不存在");
        }

        fileStorageService.delete(sysFile.getUrl());
        removeById(fileId);
    }
}