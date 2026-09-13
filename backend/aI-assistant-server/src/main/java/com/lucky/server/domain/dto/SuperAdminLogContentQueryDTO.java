package com.lucky.server.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * 超管日志内容查询条件
 * @author shiningCloud2025
 */
@Schema(description = "超管日志内容查询条件")
public record SuperAdminLogContentQueryDTO(
        @Schema(description = "日志文件名，不传默认读取当前活跃日志文件") String fileName,
        @Schema(description = "日志级别：ALL/DEBUG/INFO/WARN/ERROR，不传默认ALL") String level,
        @Schema(description = "关键字，按日志原文模糊搜索") String keyword,
        @Schema(description = "尾部行数，0表示全量读取，不传默认1000，最大200000") Integer tail
) {}