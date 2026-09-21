package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 课堂邀请码VO
 * @author shiningCloud2025
 */
@Schema(description = "课堂邀请码")
public record ClassroomInviteVO(
        @Schema(description = "当前有效的课堂邀请码") String inviteCode
) {}
