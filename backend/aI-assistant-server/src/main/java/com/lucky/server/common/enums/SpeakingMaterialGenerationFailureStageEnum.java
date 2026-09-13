package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 口语素材生成失败阶段枚举
 * @author shiningCloud2025
 */
public enum SpeakingMaterialGenerationFailureStageEnum {

    PRE_CHECK("pre_check", "前置校验"),
    MATERIAL_GENERATE("material_generate", "口语素材生成"),
    STRUCTURED_PARSE("structured_parse", "结构化结果解析"),
    TTS_GENERATE("tts_generate", "标准音频生成"),
    COS_UPLOAD("cos_upload", "音频上传"),
    PERSIST("persist", "落库");

    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    SpeakingMaterialGenerationFailureStageEnum(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    @JsonCreator
    public static SpeakingMaterialGenerationFailureStageEnum fromCode(String code) {
        for (SpeakingMaterialGenerationFailureStageEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的口语素材生成失败阶段: " + code);
    }
}
