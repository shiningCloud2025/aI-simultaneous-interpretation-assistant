package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 加入课堂请求参数
 * @author shiningCloud2025
 */
@Schema(description = "加入课堂请求参数")
public record ClassroomJoinDTO(
        @NotBlank(message = "课堂邀请码不能为空") @Pattern(regexp = "^[A-Za-z0-9]{8}$", message = "课堂邀请码格式不正确") @Schema(description = "课堂邀请码") String inviteCode,
        @NotBlank(message = "学生真实姓名不能为空") @Size(max = 32, message = "学生真实姓名长度不能超过32位") @Schema(description = "学生在课堂中的真实姓名") String studentName
) {
}
