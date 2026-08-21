package com.lucky.server.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AgentScope MySQL 存储配置
 * @author shiningCloud2025
 */
@Data
@Component
@ConfigurationProperties(prefix = "agent.scope.java.mysql")
public class AgentScopeMysqlProperties {

    /** AgentScope 状态和 Skill 存储所在数据库 */
    private String database;

    /** AgentScope 会话状态表 */
    private String sessionTable;

    /** AgentScope Skill 表 */
    private String skillTable;

    /** AgentScope Skill 资源表 */
    private String skillResourceTable;

    /** 是否自动创建数据库和表 */
    private boolean createIfNotExist = true;

    /** Skill 仓库是否允许写入 */
    private boolean skillWriteable = false;

}