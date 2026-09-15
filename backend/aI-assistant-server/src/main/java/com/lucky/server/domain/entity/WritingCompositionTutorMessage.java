package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.WritingCompositionTutorMessageRoleEnum;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 写作作文AI辅导对话消息实体
 * @author shiningCloud2025
 */
@Data
@TableName("writing_composition_tutor_message")
@Schema(name = "WritingCompositionTutorMessage", description = "写作作文AI辅导对话消息")
public class WritingCompositionTutorMessage implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @TableField("user_id")
    @Schema(description = "用户ID")
    private Long userId;

    @TableField("evaluation_id")
    @Schema(description = "作文评阅记录ID")
    private Long evaluationId;

    @TableField("role")
    @Schema(description = "消息角色")
    private WritingCompositionTutorMessageRoleEnum role;

    @TableField("content")
    @Schema(description = "消息内容")
    private String content;

    @TableField("image_urls_json")
    @Schema(description = "提问图片URL列表JSON")
    private String imageUrlsJson;

    @TableField("create_by")
    @Schema(description = "创建人")
    private String createBy;

    @TableField("create_time")
    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @TableField("update_by")
    @Schema(description = "更新人")
    private String updateBy;

    @TableField("update_time")
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @TableField("deleted")
    @Schema(description = "逻辑删除：0=正常 1=删除")
    private DeletedStatusEnum deleted;
}
