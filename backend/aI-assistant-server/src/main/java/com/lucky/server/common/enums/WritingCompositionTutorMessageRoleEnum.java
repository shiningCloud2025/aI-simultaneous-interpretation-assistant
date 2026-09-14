package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;

/**
 * 写作作文AI辅导消息角色枚举
 * @author shiningCloud2025
 */
public enum WritingCompositionTutorMessageRoleEnum {

    USER("user", "用户提问"),
    ASSISTANT("assistant", "AI回答")
    ;

    @EnumValue
    private final String code;
    private final String desc;

    WritingCompositionTutorMessageRoleEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    public String getDesc() {
        return desc;
    }

    @JsonCreator
    public static WritingCompositionTutorMessageRoleEnum fromCode(String code) {
        for (WritingCompositionTutorMessageRoleEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的写作作文AI辅导消息角色: " + code);
    }
}
