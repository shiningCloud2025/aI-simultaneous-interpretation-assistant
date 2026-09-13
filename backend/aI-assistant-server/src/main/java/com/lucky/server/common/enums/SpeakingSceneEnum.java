package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 口语场景枚举
 * @author shiningCloud2025
 */
public enum SpeakingSceneEnum {

    CAMPUS("campus", "校园生活"),
    DAILY("daily", "日常交流"),
    TRAVEL("travel", "旅行出行"),
    SHOPPING("shopping", "购物消费"),
    RESTAURANT("restaurant", "餐厅点餐"),
    INTERVIEW("interview", "面试表达"),
    PRESENTATION("presentation", "课堂展示"),
    CULTURE("culture", "文化交流"),
    SOCIAL("social", "社会话题"),
    CUSTOM("custom", "自定义");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    SpeakingSceneEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static SpeakingSceneEnum fromCode(String code) {
        for (SpeakingSceneEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的口语场景: " + code);
    }
}
