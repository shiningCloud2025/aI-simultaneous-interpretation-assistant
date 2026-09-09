package com.lucky.server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 超管日志内容数据
 * @author shiningCloud2025
 */
@Schema(description = "超管日志内容数据")
public record SuperAdminLogContentVO(
        @Schema(description = "日志文件名") String fileName,
        @Schema(description = "日志文件大小，单位字节") Long fileSize,
        @Schema(description = "日志文件大小展示文本") String fileSizeText,
        @Schema(description = "最后修改时间") LocalDateTime lastModifiedTime,
        @Schema(description = "实际读取尾部物理行数，0表示全量读取") Integer tail,
        @Schema(description = "是否全量读取") Boolean all,
        @Schema(description = "读取范围内物理行数") Integer totalLines,
        @Schema(description = "读取范围内日志条数") Integer totalEntries,
        @Schema(description = "过滤后命中日志条数") Integer matchedEntries,
        @Schema(description = "过滤后 ERROR 日志条数") Integer errorCount,
        @Schema(description = "过滤后 WARN 日志条数") Integer warnCount,
        @Schema(description = "日志条目列表") List<Entry> entries
) {

    @Schema(description = "日志条目")
    public record Entry(
            @Schema(description = "日志时间") String time,
            @Schema(description = "日志级别") String level,
            @Schema(description = "日志内容原文，包含异常堆栈等多行内容") String content
    ) {}
}