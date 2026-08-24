package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 阅读学习阶段枚举
 * @author shiningCloud2025
 */
public enum ReadingStageEnum {

    EN_PRIMARY("en_primary", "小学英语", "english"),
    EN_JUNIOR("en_junior", "初中英语", "english"),
    EN_SENIOR("en_senior", "高中英语", "english"),
    EN_CET4("en_cet4", "大学英语四级", "english"),
    EN_CET6("en_cet6", "大学英语六级", "english"),
    EN_POSTGRADUATE("en_postgraduate", "考研英语", "english"),
    EN_IELTS("en_ielts", "雅思", "english"),
    EN_TOEFL("en_toefl", "托福", "english");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    @Getter
    private final String languageCode;

    ReadingStageEnum(String code, String desc, String languageCode) {
        this.code = code;
        this.desc = desc;
        this.languageCode = languageCode;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    public boolean belongsToLanguage(String languageCode) {
        return this.languageCode.equals(languageCode);
    }

    @JsonCreator
    public static ReadingStageEnum fromCode(String code) {
        for (ReadingStageEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的阅读学习阶段: " + code);
    }
}
