package com.lucky.server.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * AgentScope Skill 原生表实体
 * @author shiningCloud2025
 */
@Data
@TableName("agent_scope_java_skills")
@Schema(name = "AgentScopeSkill", description = "AgentScope Skill 原生表")
public class AgentScopeSkill {

    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键ID")
    private Long id;

    @Schema(description = "Skill名称")
    private String name;

    @Schema(description = "Skill描述")
    private String description;

    @Schema(description = "Skill内容")
    private String skillContent;

    @Schema(description = "Skill来源")
    private String source;

    @Schema(description = "Skill元数据JSON")
    private String metadataJson;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;
}
