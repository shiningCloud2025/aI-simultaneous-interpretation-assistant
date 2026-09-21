package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 课堂状态枚举
 * @author shiningCloud2025
 */
public enum ClassroomStatusEnum {

    ARCHIVED(0, "已归档"),
    NORMAL(1, "正常");

    @EnumValue
    private final Integer code;

    @Getter
    private final String desc;

    ClassroomStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public Integer getCode() {
        return code;
    }

    @JsonCreator
    public static ClassroomStatusEnum fromCode(Integer code) {
        for (ClassroomStatusEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的课堂状态: " + code);
    }
}
