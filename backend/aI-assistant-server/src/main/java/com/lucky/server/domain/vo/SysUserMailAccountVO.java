package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.MailAccountStatusEnum;
import com.lucky.server.common.enums.MailProviderEnum;
import com.lucky.server.domain.entity.SysUserMailAccount;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

/**
 * 用户邮箱绑定账号 VO
 * @author shiningCloud2025
 */
@Schema(description = "用户邮箱绑定账号")
public record SysUserMailAccountVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "邮箱类型") String provider,
        @Schema(description = "邮箱类型名称") String providerName,
        @Schema(description = "邮箱账号/邮箱地址") String email,
        @Schema(description = "邮箱备注名") String displayName,
        @Schema(description = "是否设置平台内访问密码") Boolean accessProtected,
        @Schema(description = "状态") Integer status,
        @Schema(description = "状态名称") String statusText,
        @Schema(description = "最后测试时间") LocalDateTime lastTestTime,
        @Schema(description = "最后错误信息") String lastError,
        @Schema(description = "创建时间") LocalDateTime createTime
) {
    public static SysUserMailAccountVO from(SysUserMailAccount entity) {
        MailProviderEnum provider = entity.getProvider();
        MailAccountStatusEnum status = entity.getStatus();
        return new SysUserMailAccountVO(
                entity.getId(),
                provider == null ? null : provider.getCode(),
                provider == null ? null : provider.getDesc(),
                entity.getEmail(),
                entity.getDisplayName(),
                StringUtils.hasText(entity.getAccessPassword()),
                status == null ? null : status.getCode(),
                status == null ? null : status.getDesc(),
                entity.getLastTestTime(),
                entity.getLastError(),
                entity.getCreateTime()
        );
    }
}
