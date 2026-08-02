package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 反馈类型枚举
 * @author shiningCloud2025
 */
public enum FeedbackTypeEnum {

    BUG("BUG", "问题反馈"),
    SUGGESTION("SUGGESTION", "功能建议"),
    OTHER("OTHER", "其他");

    @EnumValue
    private final String code;
    @Getter
    private final String desc;

    FeedbackTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static FeedbackTypeEnum fromCode(String code) {
        for (FeedbackTypeEnum e : values()) {
            if (e.code.equalsIgnoreCase(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的反馈类型: " + code);
    }
}
