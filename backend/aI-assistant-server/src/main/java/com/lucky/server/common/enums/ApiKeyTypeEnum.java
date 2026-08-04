package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * API Key类型枚举
 * @author shiningCloud2025
 */
public enum ApiKeyTypeEnum {

    ASR("ASR", "语音识别"),
    LLM("LLM", "大语言模型")
    ;
    @EnumValue
    private final String code;
    @Getter
    private final String desc;

    ApiKeyTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static ApiKeyTypeEnum fromCode(String code) {
        for (ApiKeyTypeEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的Key类型: " + code);
    }
}
