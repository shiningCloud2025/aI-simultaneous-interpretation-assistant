package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.domain.entity.SysUserModelPreference;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 系统用户模型偏好VO
 * @author shiningCloud2025
 */
@Schema(description = "系统用户模型偏好")
public record SysUserModelPreferenceVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "类型：ASR/LLM") ApiKeyTypeEnum modelType,
        @Schema(description = "厂商标识") String provider,
        @Schema(description = "模型名") String modelName,
        @Schema(description = "创建时间") LocalDateTime createTime
) {
    /**
     * 从实体转换
     * @param entity 偏好实体
     * @return VO
     */
    public static SysUserModelPreferenceVO from(SysUserModelPreference entity) {
        return new SysUserModelPreferenceVO(
                entity.getId(), entity.getModelType(), entity.getProvider(), entity.getModelName(), entity.getCreateTime()
        );
    }
}
