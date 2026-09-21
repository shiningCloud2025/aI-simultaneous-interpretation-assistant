package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 课堂开课状态枚举
 * @author shiningCloud2025
 */
public enum ClassroomSessionStatusEnum {

    IN_PROGRESS(1, "进行中"),
    PAUSED(2, "已暂停"),
    ENDED(3, "已结束");

    @EnumValue
    private final Integer code;

    @Getter
    private final String desc;

    ClassroomSessionStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public Integer getCode() {
        return code;
    }

    @JsonCreator
    public static ClassroomSessionStatusEnum fromCode(Integer code) {
        for (ClassroomSessionStatusEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }

        throw new BusinessException(
                ResultCodeEnum.PARAM_ERROR,
                "不支持的课堂开课状态: " + code
        );
    }
}
