package com.lucky.server.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.lucky.server.common.basic.BusinessException;
import lombok.Getter;

/**
 * 写作题型枚举
 * @author shiningCloud2025
 */
public enum CompositionGenreEnum {

    EN_SENIOR_APPLICATION("en_senior_application", "高中应用文", "en_senior"),
    EN_CET4_SHORT_ESSAY("en_cet4_short_essay", "四级短文写作", "en_cet4"),
    EN_CET6_SHORT_ESSAY("en_cet6_short_essay", "六级短文写作", "en_cet6"),
    EN_POSTGRADUATE_PART_A("en_postgraduate_part_a", "考研小作文", "en_postgraduate"),
    EN_POSTGRADUATE_PART_B("en_postgraduate_part_b", "考研大作文", "en_postgraduate")

    ;
//    EN_PRIMARY_SHORT("en_primary_short", "小学短文写作", "en_primary"),
//    EN_JUNIOR_NARRATIVE("en_junior_narrative", "初中记叙文", "en_junior"),
//    EN_JUNIOR_APPLICATION("en_junior_application", "初中应用文", "en_junior"),
//    EN_SENIOR_ARGUMENTATIVE("en_senior_argumentative", "高中议论文", "en_senior"),
//    EN_SENIOR_APPLICATION("en_senior_application", "高中应用文", "en_senior"),
//    EN_CET4_SHORT_ESSAY("en_cet4_short_essay", "四级短文写作", "en_cet4"),
//    EN_CET6_SHORT_ESSAY("en_cet6_short_essay", "六级短文写作", "en_cet6"),
//    EN_POSTGRADUATE_PART_A("en_postgraduate_part_a", "考研小作文", "en_postgraduate"),
//    EN_POSTGRADUATE_PART_B("en_postgraduate_part_b", "考研大作文", "en_postgraduate"),
//    EN_IELTS_TASK_1("en_ielts_task_1", "雅思小作文 Task 1", "en_ielts"),
//    EN_IELTS_TASK_2("en_ielts_task_2", "雅思大作文 Task 2", "en_ielts"),
//    EN_TOEFL_INTEGRATED("en_toefl_integrated", "托福综合写作", "en_toefl"),
//    EN_TOEFL_INDEPENDENT("en_toefl_independent", "托福独立写作", "en_toefl");
    @EnumValue
    private final String code;

    @Getter
    private final String desc;

    @Getter
    private final String stageCode;

    CompositionGenreEnum(String code, String desc, String stageCode) {
        this.code = code;
        this.desc = desc;
        this.stageCode = stageCode;
    }

    @JsonValue
    public String getCode() {
        return code;
    }

    public boolean belongsToStage(String stageCode) {
        return this.stageCode.equals(stageCode);
    }

    @JsonCreator
    public static CompositionGenreEnum fromCode(String code) {
        for (CompositionGenreEnum e : values()) {
            if (e.code.equals(code)) {
                return e;
            }
        }
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "不支持的写作题型: " + code);
    }
}