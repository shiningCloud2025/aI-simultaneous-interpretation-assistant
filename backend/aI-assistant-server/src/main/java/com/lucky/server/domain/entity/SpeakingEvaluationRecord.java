package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.DeletedStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 口语跟读评测记录实体
 * @author shiningCloud2025
 */
@Data
@TableName("speaking_evaluation_records")
@Schema(name = "SpeakingEvaluationRecord", description = "口语跟读评测记录")
public class SpeakingEvaluationRecord implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("material_id")
    @Schema(description = "口语素材主表ID")
    private Long materialId;

    @TableField("sentence_id")
    @Schema(description = "口语素材句子明细ID")
    private Long sentenceId;

    @TableField("voice_id")
    @Schema(description = "腾讯云评测音频流唯一标识")
    private String voiceId;

    @TableField("ref_text")
    @Schema(description = "标准跟读文本")
    private String refText;

    @TableField("recognized_text")
    @Schema(description = "识别文本")
    private String recognizedText;

    @TableField("student_audio_url")
    @Schema(description = "学生跟读音频URL")
    private String studentAudioUrl;

    @TableField("suggested_score")
    @Schema(description = "建议得分")
    private BigDecimal suggestedScore;

    @TableField("pron_accuracy")
    @Schema(description = "发音准确度")
    private BigDecimal pronAccuracy;

    @TableField("pron_fluency")
    @Schema(description = "发音流利度")
    private BigDecimal pronFluency;

    @TableField("pron_completion")
    @Schema(description = "发音完整度")
    private BigDecimal pronCompletion;

    @TableField("word_result_json")
    @Schema(description = "单词级评测结果JSON")
    private String wordResultJson;

    @TableField("raw_response")
    @Schema(description = "腾讯云原始响应")
    private String rawResponse;

    @TableField("provider")
    @Schema(description = "评测服务厂商")
    private String provider;

    @TableField("engine_type")
    @Schema(description = "评测引擎类型")
    private String engineType;

    @TableField("eval_mode")
    @Schema(description = "评测模式")
    private Integer evalMode;

    @TableField("success")
    @Schema(description = "是否评测成功")
    private Boolean success;

    @TableField("error_code")
    @Schema(description = "错误编码")
    private String errorCode;

    @TableField("error_message")
    @Schema(description = "错误信息")
    private String errorMessage;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @TableField("deleted")
    @Schema(description = "逻辑删除：0=正常 1=删除")
    private DeletedStatusEnum deleted;
}
