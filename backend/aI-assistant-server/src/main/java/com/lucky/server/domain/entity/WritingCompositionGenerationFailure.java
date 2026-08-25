package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.lucky.server.common.enums.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 写作作文生成失败记录实体
 * @author shiningCloud2025
 */
@Data
@TableName("writing_composition_generation_failure")
@Schema(name = "WritingCompositionGenerationFailure", description = "写作作文生成失败记录")
public class WritingCompositionGenerationFailure implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("language_code")
    @Schema(description = "语言编码")
    private CompositionLanguageEnum languageCode;

    @TableField("stage_code")
    @Schema(description = "学习阶段编码")
    private CompositionStageEnum stageCode;

    @TableField("genre_code")
    @Schema(description = "题型编码")
    private CompositionGenreEnum genreCode;

    @TableField("difficulty_code")
    @Schema(description = "难度编码")
    private CompositionDifficultyEnum difficultyCode;

    @TableField("scene_code")
    @Schema(description = "场景编码")
    private CompositionSceneEnum sceneCode;

    @TableField("custom_scene")
    @Schema(description = "自定义场景")
    private String customScene;

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