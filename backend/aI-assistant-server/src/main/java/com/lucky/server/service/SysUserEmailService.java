package com.lucky.server.service;
/**
 * 系统用户邮箱验证码服务接口
 * @author shiningCloud2025
 */
public interface SysUserEmailService {

    /**
     * 发送邮箱验证码
     * @param toEmail 目标邮箱地址
     */
    void sendVerifyCode(String toEmail);

    /**
     * 校验邮箱验证码（校验成功后删除）
     * @param email     邮箱地址
     * @param inputCode 用户输入的验证码
     */
    void verifyCode(String email, String inputCode);

    /**
     * 校验邮箱验证码（只校验，不删除）
     * @param email     邮箱地址
     * @param inputCode 用户输入的验证码
     */
    void checkCode(String email, String inputCode);

    /**
     * 删除邮箱验证码
     * @param email 邮箱地址
     */
    void deleteCode(String email);
}
