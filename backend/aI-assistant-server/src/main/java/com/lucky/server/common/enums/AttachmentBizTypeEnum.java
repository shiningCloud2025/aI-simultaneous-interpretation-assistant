package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 附件业务类型枚举
 * @author shiningCloud2025
 */
public enum AttachmentBizTypeEnum {

    FEEDBACK("feedback", "用户反馈"),
    ANNOUNCEMENT("announcement", "公告"),
    USER_AVATAR("user_avatar", "用户头像");

    @EnumValue
    private final String code;
    @Getter
    private final String desc;

    AttachmentBizTypeEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static AttachmentBizTypeEnum fromCode(String code) {
        for (AttachmentBizTypeEnum e : values()) {
            if (e.code.equalsIgnoreCase(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的附件业务类型: " + code);
    }
}