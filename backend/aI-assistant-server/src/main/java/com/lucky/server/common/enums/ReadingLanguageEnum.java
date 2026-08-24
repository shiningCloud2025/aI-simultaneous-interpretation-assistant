package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 阅读语言枚举
 * @author shiningCloud2025
 */
public enum ReadingLanguageEnum {

    ENGLISH("english", "英语"),
    JAPANESE("japanese", "日语"),
    KOREAN("korean", "韩语");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    ReadingLanguageEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static ReadingLanguageEnum fromCode(String code) {
        for (ReadingLanguageEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的阅读语言: " + code);
    }
}
