package com.lucky.server.domain.vo;

import com.lucky.server.common.enums.UserStatusEnum;
import com.lucky.server.domain.entity.SysUser;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 系统用户信息VO
 * @author shiningCloud2025
 */
@Schema(description = "系统用户信息")
public record SysUserInfoVO(
        @Schema(description = "用户ID") Long id,
        @Schema(description = "账号") String account,
        @Schema(description = "用户名/昵称") String username,
        @Schema(description = "邮箱") String email,
        @Schema(description = "手机号") String phone,
        @Schema(description = "头像URL") String avatar,
        @Schema(description = "状态") UserStatusEnum status,
        @Schema(description = "最后登录时间") LocalDateTime lastLoginTime,
        @Schema(description = "最后登录IP") String lastLoginIp,
        @Schema(description = "创建时间") LocalDateTime createTime
) {
    public static SysUserInfoVO from(SysUser user) {
        return new SysUserInfoVO(
                user.getId(),
                user.getAccount(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatar(),
                user.getStatus(),
                user.getLastLoginTime(),
                user.getLastLoginIp(),
                user.getCreateTime()
        );
    }
}
