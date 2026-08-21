package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 写作场景枚举
 * @author shiningCloud2025
 */
public enum CompositionSceneEnum {

    CAMPUS("campus", "校园生活"),
    TECHNOLOGY("technology", "科技发展"),
    ENVIRONMENT("environment", "环境保护"),
    CULTURE("culture", "文化交流"),
    CAREER("career", "职业规划"),
    TRAVEL("travel", "旅行见闻"),
    SOCIAL("social", "社会热点"),
    CUSTOM("custom", "自定义");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    CompositionSceneEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static CompositionSceneEnum fromCode(String code) {
        for (CompositionSceneEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的写作场景: " + code);
    }
}