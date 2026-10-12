package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 公告状态枚举
 * @author shiningCloud2025
 */
public enum AnnouncementStatusEnum {

    DRAFT(0, "草稿"),
    PUBLISHED(1, "已发布")
    ;

    @EnumValue
    private final Integer code;
    @Getter
    private final String desc;

    AnnouncementStatusEnum(Integer code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public Integer getCode() {
        return code;
    }

    @JsonCreator
    public static AnnouncementStatusEnum fromCode(Integer code) {
        for (AnnouncementStatusEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的公告状态: " + code);
    }
}
