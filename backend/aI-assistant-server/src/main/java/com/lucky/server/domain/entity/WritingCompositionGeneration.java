package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.lucky.server.common.enums.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 写作作文生成记录实体
 * @author shiningCloud2025
 */
@Data
@TableName("writing_composition_generation")
@Schema(name = "WritingCompositionGeneration", description = "写作作文生成记录")
public class WritingCompositionGeneration implements Serializable {

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

    @TableField("title")
    @Schema(description = "作文标题")
    private String title;

    @TableField("prompt")
    @Schema(description = "作文题干")
    private String prompt;

    @TableField("requirement")
    @Schema(description = "写作要求")
    private String requirement;

    @TableField("word_limit_min")
    @Schema(description = "最低字数")
    private Integer wordLimitMin;

    @TableField("word_limit_max")
    @Schema(description = "最高字数")
    private Integer wordLimitMax;

    @TableField("key_points_json")
    @Schema(description = "写作要点JSON")
    private String keyPointsJson;

    @TableField("vocabulary_hints_json")
    @Schema(description = "词汇提示JSON")
    private String vocabularyHintsJson;

    @TableField("structure_hints_json")
    @Schema(description = "结构提示JSON")
    private String structureHintsJson;

    @TableField("scoring_criteria_json")
    @Schema(description = "评分标准JSON")
    private String scoringCriteriaJson;

    @TableField("provider")
    @Schema(description = "厂商标识")
    private String provider;

    @TableField("model_name")
    @Schema(description = "模型名")
    private String modelName;

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