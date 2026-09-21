package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 修改课堂成员请求参数
 * @author shiningCloud2025
 */
@Schema(description = "修改课堂成员请求参数")
public record ClassroomMemberUpdateDTO(
        @NotBlank(message = "学生真实姓名不能为空") @Size(max = 32, message = "学生真实姓名长度不能超过32位") @Schema(description = "学生在课堂中的真实姓名") String studentName
) {
}
