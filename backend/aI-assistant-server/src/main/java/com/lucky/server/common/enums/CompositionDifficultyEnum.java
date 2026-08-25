package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 写作难度枚举
 * @author shiningCloud2025
 */
public enum CompositionDifficultyEnum {

    EASY("easy", "简单"),
    MEDIUM("medium", "中等"),
    HARD("hard", "困难");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    CompositionDifficultyEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static CompositionDifficultyEnum fromCode(String code) {
        for (CompositionDifficultyEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的写作难度: " + code);
    }
}