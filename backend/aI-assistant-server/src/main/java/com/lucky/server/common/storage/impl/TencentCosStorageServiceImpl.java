package com.lucky.server.common.storage.impl;

import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.storage.FileStorageService;
import com.lucky.server.config.CosProperties;
import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicCOSCredentials;
import com.qcloud.cos.auth.COSCredentials;
import com.qcloud.cos.model.ObjectMetadata;
import com.qcloud.cos.model.PutObjectRequest;
import com.qcloud.cos.region.Region;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 腾讯云 COS 存储实现
 * @author shiningCloud2025
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TencentCosStorageServiceImpl implements FileStorageService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    private final CosProperties cosProperties;

    private COSClient getClient() {
        COSCredentials cred = new BasicCOSCredentials(cosProperties.getSecretId(), cosProperties.getSecretKey());
        ClientConfig clientConfig = new ClientConfig(new Region(cosProperties.getRegion()));
        return new COSClient(cred, clientConfig);
    }

    @Override
    public String upload(String fileName, InputStream inputStream, long size, String contentType) {
        COSClient cosClient = getClient();
        try {
            String dateDir = LocalDate.now().format(DATE_FORMAT);
            String key = dateDir + "/" + UUID.randomUUID() + "/" + fileName;
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(size);
            metadata.setContentType(contentType);
            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    cosProperties.getBucketName(), key, inputStream, metadata);
            cosClient.putObject(putObjectRequest);
            return cosClient.getObjectUrl(cosProperties.getBucketName(), key).toString();
        } catch (Exception e) {
            log.error("[COS] 上传失败", e);
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "文件上传失败");
        } finally {
            cosClient.shutdown();
        }
    }

    @Override
    public void delete(String url) {
        COSClient cosClient = getClient();
        try {
            String domain = cosProperties.getDomain();
            String key = url.startsWith(domain) ? url.substring(domain.length() + 1) : url;
            cosClient.deleteObject(cosProperties.getBucketName(), key);
        } catch (Exception e) {
            log.error("[COS] 删除失败", e);
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "文件删除失败");
        } finally {
            cosClient.shutdown();
        }
    }
}