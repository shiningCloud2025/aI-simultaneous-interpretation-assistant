package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.WritingCompositionTutorMessageRoleEnum;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 写作作文AI辅导对话消息视图
 * @author shiningCloud2025
 */
@Schema(description = "写作作文AI辅导对话消息视图")
public record WritingCompositionTutorMessageVO(
        @Schema(description = "消息ID") Long id,
        @Schema(description = "作文评阅记录ID") Long evaluationId,
        @Schema(description = "消息角色") WritingCompositionTutorMessageRoleEnum role,
        @Schema(description = "消息角色名称") String roleName,
        @Schema(description = "消息内容") String content,
        @Schema(description = "提问图片URL列表") List<String> imageUrls,
        @Schema(description = "创建时间") LocalDateTime createTime
) {
}
