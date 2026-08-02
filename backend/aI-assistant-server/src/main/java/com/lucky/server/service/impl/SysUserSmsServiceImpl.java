package com.lucky.server.service.impl;

import com.aliyun.auth.credentials.Credential;
import com.aliyun.auth.credentials.provider.StaticCredentialProvider;
import com.aliyun.sdk.service.dypnsapi20170525.AsyncClient;
import com.aliyun.sdk.service.dypnsapi20170525.models.SendSmsVerifyCodeRequest;
import com.aliyun.sdk.service.dypnsapi20170525.models.SendSmsVerifyCodeResponse;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.service.SysUserSmsService;
import darabonba.core.client.ClientOverrideConfiguration;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

/**
 * 系统用户短信服务实现
 * @author shiningCloud2025
 */
@Service
@Slf4j
public class SysUserSmsServiceImpl implements SysUserSmsService {

    // ==================== Redis 相关 (从新配置读取) ====================
    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Value("${custom.duanxin.verify.code.expire-seconds}")
    private long codeExpireSeconds;

    @Value("${custom.duanxin.verify.code.redis-prefix}")
    private String codeRedisPrefix;

    @Value("${custom.duanxin.verify.duanxin.send-interval-seconds}")
    private long sendIntervalSeconds;

    @Value("${custom.duanxin.verify.duanxin.redis-prefix}")
    private String sendRecordRedisPrefix;

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

    /**
     * 发送短信验证码（使用新配置）
     */
    @Override
    public void sendVerifyCode(String phoneNumber) {
        // 1. 校验手机号格式
        validatePhoneNumber(phoneNumber);

        // 2. 校验发送频率
        String sendRecordKey = sendRecordRedisPrefix + phoneNumber;
        if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(sendRecordKey))) {
            log.warn("手机号 [{}] 发送短信过于频繁", phoneNumber);
            throw new BusinessException(ResultCodeEnum.TOO_MANY_REQUESTS, "短信发送过于频繁，请稍后再试");
        }

        try {
            // 3. 生成验证码
            String verificationCode = generateCode();
            log.info("为手机号 [{}] 生成短信验证码：{}", phoneNumber, verificationCode);

            // 4. 构建并发送短信
            String templateParam = String.format("{\"code\":\"%s\",\"min\":\"%d\"}", verificationCode, validTime / 60);
            SendSmsVerifyCodeRequest sendRequest = SendSmsVerifyCodeRequest.builder()
                    .signName(signName)
                    .templateCode(templateCode)
                    .phoneNumber(phoneNumber)
                    .templateParam(templateParam)
                    .codeLength((long) codeLength)
                    .validTime(validTime)
                    .build();

            SendSmsVerifyCodeResponse response = asyncClient.sendSmsVerifyCode(sendRequest).get();

            // 5. 校验发送结果
            if (response.getBody() == null || !"OK".equals(response.getBody().getCode())) {
                String errorMsg = response.getBody() != null ? response.getBody().getMessage() : "未知错误";
                log.error("手机号 [{}] 短信发送失败: {}", phoneNumber, errorMsg);
                throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "短信发送失败：" + errorMsg);
            }

            // 6. 存储验证码到 Redis
            String codeKey = codeRedisPrefix + phoneNumber;
            stringRedisTemplate.opsForValue().set(codeKey, verificationCode, codeExpireSeconds, TimeUnit.SECONDS);

            // 7. 记录发送时间（防止频率刷接口）
            stringRedisTemplate.opsForValue().set(sendRecordKey, "sent", sendIntervalSeconds, TimeUnit.SECONDS);

            log.info("手机号 [{}] 短信发送成功", phoneNumber);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("手机号 [{}] 短信发送异常: ", phoneNumber, e);
            throw new BusinessException(ResultCodeEnum.SYSTEM_ERROR, "短信发送异常");
        }
    }
    /**
     * 校验短信验证码
     */
    @Override
    public void verifyCode(String phoneNumber, String inputCode) {
        checkCode(phoneNumber, inputCode);
        deleteCode(phoneNumber);
    }

    /**
     * 校验短信验证码（只校验，不删除）
     */
    @Override
    public void checkCode(String phoneNumber, String inputCode) {
        // 1. 校验参数
        if (phoneNumber == null || inputCode == null || phoneNumber.trim().isEmpty() || inputCode.trim().isEmpty()) {
            log.warn("手机号 [{}] 验证码校验参数无效", phoneNumber);
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "验证码参数无效");
        }

        // 2. 从 Redis 获取存储的验证码
        String codeKey = codeRedisPrefix + phoneNumber;
        String storedCode = stringRedisTemplate.opsForValue().get(codeKey);

        // 3. 比对验证码
        if (storedCode == null) {
            log.warn("手机号 [{}] 验证码不存在或已过期", phoneNumber);
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "验证码不存在或已过期");
        }

        if (inputCode.equals(storedCode)) {
            log.info("手机号 [{}] 验证码校验成功", phoneNumber);
        } else {
            log.warn("手机号 [{}] 验证码校验失败，输入: {}, 存储: {}", phoneNumber, inputCode, storedCode);
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "验证码错误");
        }
    }

    @Override
    public void deleteCode(String phoneNumber) {
        String codeKey = codeRedisPrefix + phoneNumber;
        stringRedisTemplate.delete(codeKey);
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


    /**
     * 手机号格式校验
     */
    private void validatePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().length() != 11 || !phoneNumber.matches("\\d+")) {
            log.warn("手机号 [{}] 格式不正确", phoneNumber);
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "手机号格式不正确");
        }
    }

    /**
     * 生成大小写字母+数字的验证码
     */
    private String generateCode() {
        // 不再需要硬编码默认值，因为 @Value 已经提供了 :6 的默认值
        StringBuilder codeBuilder = new StringBuilder(codeLength);
        for (int i = 0; i < codeLength; i++) {
            codeBuilder.append(CODE_CHARACTERS.charAt(SECURE_RANDOM.nextInt(CODE_CHARACTERS.length())));
        }
        return codeBuilder.toString();
    }

}
