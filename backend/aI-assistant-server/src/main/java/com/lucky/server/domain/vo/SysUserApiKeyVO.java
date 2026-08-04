package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.domain.entity.SysUserApiKey;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 系统用户API Key VO
 * @author shiningCloud2025
 */
@Schema(description = "系统用户API Key")
public record SysUserApiKeyVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "厂商标识") String provider,
        @Schema(description = "类型：ASR/LLM") ApiKeyTypeEnum keyType,
        @Schema(description = "API Key(脱敏)") String apiKeyMask,
        @Schema(description = "状态：0=未测试 1=可用 2=不可用") Integer status,
        @Schema(description = "最后测试时间") LocalDateTime lastTestTime,
        @Schema(description = "创建时间") LocalDateTime createTime
) {
    public static SysUserApiKeyVO from(SysUserApiKey entity) {
        String mask = entity.getApiKey();
        if (mask != null && mask.length() > 8) {
            mask = mask.substring(0, 4) + "****" + mask.substring(mask.length() - 4);
        }
        return new SysUserApiKeyVO(
                entity.getId(),
                entity.getProvider(),
                entity.getKeyType(),
                mask,
                entity.getStatus(),
                entity.getLastTestTime(),
                entity.getCreateTime()
        );
    }
}
