package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;

/**
 * 删除状态枚举
 * @author shiningCloud2025
 */
public enum DeletedStatusEnum {

    NORMAL(0, "正常"),
    DELETED(1, "删除")
    ;

    @EnumValue
    private final Integer code;
    private final String desc;

    DeletedStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public Integer getCode() {
        return code;
    }

    @JsonCreator
    public static DeletedStatusEnum fromCode(Integer code) {
        for (DeletedStatusEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的删除状态: " + code);
    }
}
