package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 阅读单词素材失败阶段枚举
 * @author shiningCloud2025
 */
public enum ReadingWordMaterialFailureStageEnum {

    PRE_CHECK("pre_check", "前置校验"),
    SENTENCE_GENERATE("sentence_generate", "例句生成"),
    IMAGE_GENERATE("image_generate", "图片生成"),
    PERSIST("persist", "落库");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    ReadingWordMaterialFailureStageEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static ReadingWordMaterialFailureStageEnum fromCode(String code) {
        for (ReadingWordMaterialFailureStageEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的阅读单词素材失败阶段: " + code);
    }
}
