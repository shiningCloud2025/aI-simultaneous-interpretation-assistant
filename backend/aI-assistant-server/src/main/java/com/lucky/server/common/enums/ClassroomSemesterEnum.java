package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 课堂学期枚举
 * @author shiningCloud2025
 */
public enum ClassroomSemesterEnum {

    FIRST("FIRST", "第一学期"),
    SECOND("SECOND", "第二学期");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    ClassroomSemesterEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static ClassroomSemesterEnum fromCode(String code) {
        for (ClassroomSemesterEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的课堂学期: " + code);
    }
}
