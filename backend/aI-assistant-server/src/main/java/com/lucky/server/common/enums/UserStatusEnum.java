package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 用户状态枚举
 * @author shiningCloud2025
 */
public enum UserStatusEnum {

    DISABLED(0, "禁用"),
    ENABLED(1, "启用")
    ;
    @EnumValue
    private final Integer code;
    @Getter
    private final String desc;

    UserStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public Integer getCode() {
        return code;
    }

    @JsonCreator
    public static UserStatusEnum fromCode(Integer code) {
        for (UserStatusEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的用户状态: " + code);
    }
}
