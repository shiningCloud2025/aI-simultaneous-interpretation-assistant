package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.MailAccountStatusEnum;
import com.lucky.server.common.enums.MailProviderEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.entity.SysUserMailAccount;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

/**
 * 超管邮箱绑定管理VO
 * @author shiningCloud2025
 */
@Schema(description = "超管邮箱绑定管理VO")
public record SuperAdminMailAccountManageVO(
        @Schema(description = "主键ID") Long id,
        @Schema(description = "用户ID") Long userId,
        @Schema(description = "用户账号") String account,
        @Schema(description = "用户名") String username,
        @Schema(description = "用户类型") UserTypeEnum userType,
        @Schema(description = "用户类型名称") String userTypeText,
        @Schema(description = "邮箱类型") MailProviderEnum provider,
        @Schema(description = "邮箱类型名称") String providerName,
        @Schema(description = "邮箱账号/邮箱地址") String email,
        @Schema(description = "邮箱备注名") String displayName,
        @Schema(description = "是否设置平台内访问密码") Boolean accessProtected,
        @Schema(description = "邮箱状态") MailAccountStatusEnum status,
        @Schema(description = "邮箱状态名称") String statusText,
        @Schema(description = "最后测试时间") LocalDateTime lastTestTime,
        @Schema(description = "最后错误信息") String lastError,
        @Schema(description = "创建者ID") Long createdById,
        @Schema(description = "创建时间") LocalDateTime createTime,
        @Schema(description = "更新者ID") Long updatedById,
        @Schema(description = "更新时间") LocalDateTime updateTime
) {
    public static SuperAdminMailAccountManageVO from(SysUserMailAccount account, SysUser user) {
        MailProviderEnum provider = account.getProvider();
        MailAccountStatusEnum status = account.getStatus();
        UserTypeEnum userType = user == null ? null : user.getUserType();
        return new SuperAdminMailAccountManageVO(
                account.getId(),
                account.getUserId(),
                user == null ? null : user.getAccount(),
                user == null ? null : user.getUsername(),
                userType,
                userType == null ? null : userType.getDesc(),
                provider,
                provider == null ? null : provider.getDesc(),
                account.getEmail(),
                account.getDisplayName(),
                StringUtils.hasText(account.getAccessPassword()),
                status,
                status == null ? null : status.getDesc(),
                account.getLastTestTime(),
                account.getLastError(),
                account.getCreatedById(),
                account.getCreateTime(),
                account.getUpdatedById(),
                account.getUpdateTime()
        );
    }
}
