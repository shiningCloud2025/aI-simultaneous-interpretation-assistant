package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 课堂学习阶段枚举
 * @author shiningCloud2025
 */
public enum ClassroomStageEnum {

    PRIMARY_1("primary_1", "小学一年级"),
    PRIMARY_2("primary_2", "小学二年级"),
    PRIMARY_3("primary_3", "小学三年级"),
    PRIMARY_4("primary_4", "小学四年级"),
    PRIMARY_5("primary_5", "小学五年级"),
    PRIMARY_6("primary_6", "小学六年级"),

    JUNIOR_1("junior_1", "初中一年级"),
    JUNIOR_2("junior_2", "初中二年级"),
    JUNIOR_3("junior_3", "初中三年级"),

    SENIOR_1("senior_1", "高中一年级"),
    SENIOR_2("senior_2", "高中二年级"),
    SENIOR_3("senior_3", "高中三年级"),

    UNIVERSITY_1("university_1", "大学一年级"),
    UNIVERSITY_2("university_2", "大学二年级"),
    UNIVERSITY_3("university_3", "大学三年级"),
    UNIVERSITY_4("university_4", "大学四年级"),

    POSTGRADUATE_1("postgraduate_1", "研究生一年级"),
    POSTGRADUATE_2("postgraduate_2", "研究生二年级"),
    POSTGRADUATE_3("postgraduate_3", "研究生三年级");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    ClassroomStageEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static ClassroomStageEnum fromCode(String code) {
        for (ClassroomStageEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的课堂学习阶段: " + code);
    }
}
