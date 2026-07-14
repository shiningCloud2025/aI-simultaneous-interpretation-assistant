package com.lucky.server.common.enums;


import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

/**
 * ASR模型厂商枚举
 * @author shiningCloud2025
 */
public enum AsrModelProviderEnum {

    ALIBABA("alibaba", "阿里云百炼"),

    ;

    private final String code;
    @Getter
    private final String displayName;

    AsrModelProviderEnum(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static AsrModelProviderEnum fromCode(String code) {
        for (AsrModelProviderEnum p : values()) {
            if (p.code.equalsIgnoreCase(code)) {
                return p;
            }
        }
        throw new IllegalArgumentException("不支持的ASR厂商: " + code);
    }
}
