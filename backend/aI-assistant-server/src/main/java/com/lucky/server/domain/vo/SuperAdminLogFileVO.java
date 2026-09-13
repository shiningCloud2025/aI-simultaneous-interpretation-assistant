package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * 超管日志文件信息
 * @author shiningCloud2025
 */
@Schema(description = "超管日志文件信息")
public record SuperAdminLogFileVO(
        @Schema(description = "日志文件名") String fileName,
        @Schema(description = "日志文件大小，单位字节") Long fileSize,
        @Schema(description = "日志文件大小展示文本") String fileSizeText,
        @Schema(description = "最后修改时间") LocalDateTime lastModifiedTime,
        @Schema(description = "是否当前活跃日志文件") Boolean current
) {}