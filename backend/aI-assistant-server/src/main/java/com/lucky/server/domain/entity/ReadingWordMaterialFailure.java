package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ReadingLanguageEnum;
import com.lucky.server.common.enums.ReadingStageEnum;
import com.lucky.server.common.enums.ReadingWordMaterialFailureStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 阅读单词素材失败记录实体
 * @author shiningCloud2025
 */
@Data
@TableName("reading_word_material_failure")
@Schema(name = "ReadingWordMaterialFailure", description = "阅读单词素材失败记录")
public class ReadingWordMaterialFailure implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("word")
    @Schema(description = "单词/词语")
    private String word;

    @TableField("language_code")
    @Schema(description = "语言编码")
    private ReadingLanguageEnum languageCode;

    @TableField("stage_code")
    @Schema(description = "学习阶段编码")
    private ReadingStageEnum stageCode;

    @TableField("provider")
    @Schema(description = "句子生成厂商标识")
    private String provider;

    @TableField("model_name")
    @Schema(description = "句子生成模型名")
    private String modelName;

    @TableField("image_provider")
    @Schema(description = "图片生成厂商标识")
    private String imageProvider;

    @TableField("image_model_name")
    @Schema(description = "图片生成模型名")
    private String imageModelName;

    @TableField("failure_stage")
    @Schema(description = "失败阶段")
    private ReadingWordMaterialFailureStageEnum failureStage;

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
