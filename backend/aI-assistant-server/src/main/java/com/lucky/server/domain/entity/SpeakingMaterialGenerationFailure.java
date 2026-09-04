package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.SpeakingDifficultyEnum;
import com.lucky.server.common.enums.SpeakingLanguageEnum;
import com.lucky.server.common.enums.SpeakingMaterialGenerationFailureStageEnum;
import com.lucky.server.common.enums.SpeakingSceneEnum;
import com.lucky.server.common.enums.SpeakingStageEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 口语素材生成失败记录实体
 * @author shiningCloud2025
 */
@Data
@TableName("speaking_material_generation_failure")
@Schema(name = "SpeakingMaterialGenerationFailure", description = "口语素材生成失败记录")
public class SpeakingMaterialGenerationFailure implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("language_code")
    @Schema(description = "语言编码")
    private SpeakingLanguageEnum languageCode;

    @TableField("stage_code")
    @Schema(description = "学习阶段编码")
    private SpeakingStageEnum stageCode;

    @TableField("difficulty_code")
    @Schema(description = "难度编码")
    private SpeakingDifficultyEnum difficultyCode;

    @TableField("scene_code")
    @Schema(description = "场景编码")
    private SpeakingSceneEnum sceneCode;

    @TableField("user_prompt")
    @Schema(description = "用户提示词/偏好说明")
    private String userPrompt;

    @TableField("provider")
    @Schema(description = "LLM厂商标识")
    private String provider;

    @TableField("model_name")
    @Schema(description = "LLM模型名")
    private String modelName;

    @TableField("tts_provider")
    @Schema(description = "TTS厂商标识")
    private String ttsProvider;

    @TableField("tts_model_name")
    @Schema(description = "TTS模型名")
    private String ttsModelName;

    @TableField("tts_voice")
    @Schema(description = "TTS音色")
    private String ttsVoice;

    @TableField("tts_speech_rate")
    @Schema(description = "TTS语速")
    private BigDecimal ttsSpeechRate;

    @TableField("failure_stage")
    @Schema(description = "失败阶段")
    private SpeakingMaterialGenerationFailureStageEnum failureStage;

    @TableField("error_message")
    @Schema(description = "失败原因")
    private String errorMessage;

    @TableField("raw_response")
    @Schema(description = "模型原始响应/异常上下文")
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
