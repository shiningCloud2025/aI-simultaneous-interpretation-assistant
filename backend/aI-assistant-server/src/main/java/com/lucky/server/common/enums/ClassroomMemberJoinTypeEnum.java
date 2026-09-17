package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 课堂成员加入方式枚举
 * @author shiningCloud2025
 */
public enum ClassroomMemberJoinTypeEnum {

    INVITE_CODE("INVITE_CODE", "邀请码加入");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    ClassroomMemberJoinTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static ClassroomMemberJoinTypeEnum fromCode(String code) {
        for (ClassroomMemberJoinTypeEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的课堂成员加入方式: " + code);
    }
}
