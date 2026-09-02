package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 用户类型枚举
 * 层级：superadmin 平台超级管理员 > [预留 admin 企管] > teacher / student
 * @author shiningCloud2025
 */
public enum UserTypeEnum {

    STUDENT("student", "学生"),
    TEACHER("teacher", "老师"),
    SUPER_ADMIN("superadmin", "超级管理员"),
    ;

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    UserTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static UserTypeEnum fromCode(String code) {
        for (UserTypeEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的用户类型: " + code);
    }
}
