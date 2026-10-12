package com.lucky.server.common.util;

import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

/**
 * 邮箱授权码加解密工具类
 * @author shiningCloud2025
 */
@Component
public class MailAuthCodeCryptoUtil {

    private static final String ALGORITHM = "AES";

    private final SecretKeySpec secretKeySpec;

    public MailAuthCodeCryptoUtil(@Value("${custom.mail.auth-code-secret}") String secret) {
        this.secretKeySpec = buildKey(secret);
    }

    public String encrypt(String plainText) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "邮箱授权码加密失败");
        }
    }

    public String decrypt(String cipherText) {
        try {
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
            byte[] decoded = Base64.getDecoder().decode(cipherText);
            return new String(cipher.doFinal(decoded), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "邮箱授权码解密失败");
        }
    }

    private SecretKeySpec buildKey(String secret) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] key = sha.digest(secret.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(Arrays.copyOf(key, 16), ALGORITHM);
        } catch (Exception e) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "邮箱授权码密钥初始化失败");
        }
    }
}
