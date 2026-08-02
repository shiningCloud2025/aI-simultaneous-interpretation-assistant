package com.lucky.server.service.impl;

import com.aliyun.auth.credentials.Credential;
import com.aliyun.auth.credentials.provider.StaticCredentialProvider;
import com.aliyun.sdk.service.dypnsapi20170525.AsyncClient;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.service.SysUserSmsService;
import darabonba.core.client.ClientOverrideConfiguration;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

/**
 * 系统用户短信服务实现
 * @author shiningCloud2025
 */
@Service
@Slf4j
public class SysUserSmsServiceImpl implements SysUserSmsService {

    // ==================== 短信配置 (从新配置读取) ====================
    @Value("${ali.sms.access-key-id}")
    private String accessKeyId;

    @Value("${ali.sms.access-key-secret}")
    private String accessKeySecret;

    @Value("${ali.sms.sign-name}")
    private String signName;

    @Value("${ali.sms.template-code}")
    private String templateCode;

    @Value("${ali.sms.region-id}")
    private String regionId;

    @Value("${ali.sms.endpoint}")
    private String endpoint;

    // 从新配置读取验证码长度，如果配置不存在则使用默认值6
    @Value("${custom.duanxin.verify.code.length:6}")
    private int codeLength;

    @Value("${ali.sms.valid-time}")
    private long validTime;

    // ==================== 内部成员 ====================
    private AsyncClient asyncClient;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";


    /**
     * 初始化阿里云短信客户端
     */
    @PostConstruct
    public void initClient() {
        log.info("开始初始化阿里云短信客户端...");
        try {
            if (accessKeyId == null || accessKeySecret == null || signName == null || templateCode == null) {
                log.error("阿里云短信核心配置缺失！");
                throw new BusinessException(ResultCodeEnum.SYSTEM_ERROR, "阿里云短信配置缺失");
            }

            StaticCredentialProvider credentialProvider = StaticCredentialProvider.create(
                    Credential.builder()
                            .accessKeyId(accessKeyId)
                            .accessKeySecret(accessKeySecret)
                            .build()
            );

            this.asyncClient = AsyncClient.builder()
                    .region(regionId)
                    .credentialsProvider(credentialProvider)
                    .overrideConfiguration(ClientOverrideConfiguration.create().setEndpointOverride(endpoint))
                    .build();
            log.info("阿里云短信客户端初始化完成");
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("初始化阿里云短信客户端异常: ", e);
            throw new BusinessException(ResultCodeEnum.SYSTEM_ERROR, "短信客户端初始化失败");
        }
    }


    @Override
    public void sendVerifyCode(String phoneNumber) {

    }

    @Override
    public void verifyCode(String phoneNumber, String inputCode) {

    }

    @Override
    public void checkCode(String phoneNumber, String inputCode) {

    }

    @Override
    public void deleteCode(String phoneNumber) {

    }

    /**
     * 销毁短信客户端
     */
    @PreDestroy
    public void destroyClient() {
        if (asyncClient != null) {
            log.info("关闭阿里云短信客户端...");
            asyncClient.close();
            log.info("阿里云短信客户端已关闭");
        }
    }
}
