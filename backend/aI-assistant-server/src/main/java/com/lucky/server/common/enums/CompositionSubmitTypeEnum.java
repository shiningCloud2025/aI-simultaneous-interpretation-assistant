package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 作文提交类型枚举
 * @author shiningCloud2025
 */
public enum CompositionSubmitTypeEnum {

    TEXT("text", "文本提交"),
    IMAGE("image", "图片提交");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    CompositionSubmitTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static CompositionSubmitTypeEnum fromCode(String code) {
        for (CompositionSubmitTypeEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的作文提交类型: " + code);
    }
}