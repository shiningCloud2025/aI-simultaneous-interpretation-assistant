package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 文件上传响应
 * @author shiningCloud2025
 */
@Schema(description = "文件上传响应")
public record SysFileVO(
        @Schema(description = "文件ID") Long id,
        @Schema(description = "文件URL") String url,
        @Schema(description = "原文件名") String fileName,
        @Schema(description = "文件大小（字节）") Integer fileSize,
        @Schema(description = "MIME类型") String mimeType,
        @Schema(description = "文件大类") String fileType
) {
}