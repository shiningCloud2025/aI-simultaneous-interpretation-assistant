package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.CompositionGenreEnum;
import com.lucky.server.common.enums.CompositionLanguageEnum;
import com.lucky.server.common.enums.CompositionStageEnum;
import com.lucky.server.common.enums.CompositionSubmitTypeEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 写作作文评估失败记录实体
 * @author shiningCloud2025
 */
@Data
@TableName("writing_composition_evaluation_failure")
@Schema(name = "WritingCompositionEvaluationFailure", description = "写作作文评估失败记录")
public class WritingCompositionEvaluationFailure implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("generation_id")
    @Schema(description = "作文生成记录ID：为空表示非系统生成题目")
    private Long generationId;

    @TableField("submit_type")
    @Schema(description = "提交类型：text=文本 image=图片")
    private CompositionSubmitTypeEnum submitType;

    @TableField("language_code")
    @Schema(description = "语言编码")
    private CompositionLanguageEnum languageCode;

    @TableField("stage_code")
    @Schema(description = "学习阶段编码")
    private CompositionStageEnum stageCode;

    @TableField("genre_code")
    @Schema(description = "题型编码")
    private CompositionGenreEnum genreCode;

    @TableField("title")
    @Schema(description = "作文题目")
    private String title;

    @TableField("prompt")
    @Schema(description = "作文题干")
    private String prompt;

    @TableField("scoring_criteria")
    @Schema(description = "评分标准")
    private String scoringCriteria;

    @TableField("content")
    @Schema(description = "作文正文")
    private String content;

    @TableField("image_urls_json")
    @Schema(description = "作文图片URL列表JSON")
    private String imageUrlsJson;

    @TableField("ocr_text")
    @Schema(description = "图片识别文本")
    private String ocrText;

    @TableField("provider")
    @Schema(description = "厂商标识")
    private String provider;

    @TableField("model_name")
    @Schema(description = "模型名")
    private String modelName;

    @TableField("failure_stage")
    @Schema(description = "失败阶段")
    private String failureStage;

    @TableField("error_code")
    @Schema(description = "错误编码")
    private String errorCode;

    @TableField("error_message")
    @Schema(description = "错误信息")
    private String errorMessage;

    @TableField("raw_response")
    @Schema(description = "模型原始响应")
    private String rawResponse;

    @TableField("created_by_id")
    @Schema(description = "创建者ID")
    private Long createdById;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("updated_by_id")
    @Schema(description = "更新者ID")
    private Long updatedById;

    @TableField("update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @TableField("deleted")
    @Schema(description = "逻辑删除：0=正常 1=删除")
    private DeletedStatusEnum deleted;
}
