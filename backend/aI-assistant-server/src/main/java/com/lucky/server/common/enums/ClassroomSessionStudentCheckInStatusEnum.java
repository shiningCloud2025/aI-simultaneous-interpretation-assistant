package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 课堂课次学生签到状态枚举
 * @author shiningCloud2025
 */
public enum ClassroomSessionStudentCheckInStatusEnum {

    ABSENT(0, "缺席"),
    PRESENT(1, "到课");

    @EnumValue
    private final Integer code;

    @Getter
    private final String desc;

    ClassroomSessionStudentCheckInStatusEnum(
            Integer code,
            String desc
    ) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public Integer getCode() {
        return code;
    }

    @JsonCreator
    public static ClassroomSessionStudentCheckInStatusEnum fromCode(
            Integer code
    ) {
        for (ClassroomSessionStudentCheckInStatusEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }

        throw new BusinessException(
                ResultCodeEnum.PARAM_ERROR,
                "不支持的课次学生签到状态: " + code
        );
    }
}
