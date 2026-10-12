package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 邮箱服务厂商枚举
 * @author shiningCloud2025
 */
public enum MailProviderEnum {

    QQ("QQ", "QQ邮箱", "imap.qq.com", 993, "smtp.qq.com", 465),
    NETEASE_163("NETEASE_163", "网易163邮箱", "imap.163.com", 993, "smtp.163.com", 465)
    ;

    @EnumValue
    private final String code;
    @Getter
    private final String desc;
    @Getter
    private final String imapHost;
    @Getter
    private final Integer imapPort;
    @Getter
    private final String smtpHost;
    @Getter
    private final Integer smtpPort;

    MailProviderEnum(String code, String desc, String imapHost, Integer imapPort, String smtpHost, Integer smtpPort) {
        this.code = code;
        this.desc = desc;
        this.imapHost = imapHost;
        this.imapPort = imapPort;
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static MailProviderEnum fromCode(String code) {
        for (MailProviderEnum e : values()) {
            if (e.code.equalsIgnoreCase(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的邮箱厂商: " + code);
    }
}
