package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 口语TTS音色枚举
 * @author shiningCloud2025
 */
public enum SpeakingTtsVoiceEnum {

    LOONG_MARY("loongmary", "loongmary", "温暖英音", "20岁", "女", "英文"),
    LOONG_EVA("loongeva_v3.6", "loongeva", "高智美音", "28岁", "女", "英文"),
    LOONG_JOHN("loongjohn", "loongJohn", "沉稳亲切美音", "28岁", "男", "英文");

    @EnumValue
    private final String code;

    @Getter
    private final String display;

    @Getter
    private final String feature;

    @Getter
    private final String age;

    @Getter
    private final String gender;

    @Getter
    private final String language;

    SpeakingTtsVoiceEnum(String code, String display, String feature, String age, String gender, String language) {
        this.code = code;
        this.display = display;
        this.feature = feature;
        this.age = age;
        this.gender = gender;
        this.language = language;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static SpeakingTtsVoiceEnum fromCode(String code) {
        for (SpeakingTtsVoiceEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的口语TTS音色: " + code);
    }
}