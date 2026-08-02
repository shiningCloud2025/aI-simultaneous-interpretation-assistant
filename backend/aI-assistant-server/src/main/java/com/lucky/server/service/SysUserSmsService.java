package com.lucky.server.service;
/**
 * 系统用户短信服务接口
 * @author shiningCloud2025
 */
public interface SysUserSmsService {
    /**
     * 发送短信验证码
     * @param phoneNumber
     */
    public void sendVerifyCode(String phoneNumber);

    /**
     * 校验短信验证码（校验成功后删除）
     * @param phoneNumber
     * @param inputCode
     */
    public void verifyCode(String phoneNumber, String inputCode);

    /**
     * 校验短信验证码（只校验，不删除）
     * @param phoneNumber
     * @param inputCode
     */
    public void checkCode(String phoneNumber, String inputCode);

    /**
     * 删除短信验证码
     * @param phoneNumber
     */
    public void deleteCode(String phoneNumber);
}
