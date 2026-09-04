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
import java.time.LocalDateTime;

/**
 * 口语素材句子明细实体
 * @author shiningCloud2025
 */
@Data
@TableName("speaking_material_sentence")
@Schema(name = "SpeakingMaterialSentence", description = "口语素材句子明细")
public class SpeakingMaterialSentence implements Serializable {

    @Serial
    private final static long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("material_id")
    @Schema(description = "口语素材生成记录ID")
    private Long materialId;

    @TableField("sort_order")
    @Schema(description = "句子排序")
    private Integer sortOrder;

    @TableField("sentence")
    @Schema(description = "跟读句子")
    private String sentence;

    @TableField("translation")
    @Schema(description = "句子译文")
    private String translation;

    @TableField("tts_text")
    @Schema(description = "TTS合成文本")
    private String ttsText;

    @TableField("standard_audio_url")
    @Schema(description = "标准跟读音频URL")
    private String standardAudioUrl;

    @TableField("key_points")
    @Schema(description = "重点词/重点表达JSON")
    private String keyPoints;

    @TableField("practice_tips")
    @Schema(description = "跟读建议JSON")
    private String practiceTips;

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
