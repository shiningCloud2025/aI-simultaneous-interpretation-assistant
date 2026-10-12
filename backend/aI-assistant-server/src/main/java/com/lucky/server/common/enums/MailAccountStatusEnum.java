package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 用户邮箱绑定状态枚举
 * @author shiningCloud2025
 */
public enum MailAccountStatusEnum {

    UNTESTED(0, "未测试"),
    AVAILABLE(1, "可用"),
    UNAVAILABLE(2, "不可用"),
    DISABLED(3, "禁用")
    ;

    @EnumValue
    private final Integer code;
    @Getter
    private final String desc;

    MailAccountStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public Integer getCode() {
        return code;
    }

    @JsonCreator
    public static MailAccountStatusEnum fromCode(Integer code) {
        for (MailAccountStatusEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的邮箱状态: " + code);
    }
}
