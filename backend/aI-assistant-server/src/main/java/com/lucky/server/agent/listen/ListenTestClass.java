package com.lucky.server.agent.listen;

import io.agentscope.core.tool.Toolkit;
import io.agentscope.core.tool.builtin.TodoTools;

/**
 * 听力模块测试类-由于使用的是AgentScopeJava来实现AI能力，有一些要自已进行测试
 * @author shiningCloud2025
 */
public class ListenTestClass {
    /**
     * 测试registerTool失效问题
     * 原因:
     * jsonschema-generator = 4.31.1
     * jsonschema-module-jackson = 4.38.0
     * 版本冲突
     * 解决方案:
     * <dependency>
     *     <groupId>com.github.victools</groupId>
     *     <artifactId>jsonschema-generator</artifactId>
     *     <version>4.38.0</version>
     * </dependency>
     *
     * <dependency>
     *     <groupId>com.github.victools</groupId>
     *     <artifactId>jsonschema-module-jackson</artifactId>
     *     <version>4.38.0</version>
     * </dependency>
     */
    static void main1() {
        Toolkit toolkit = new Toolkit();
        toolkit.registerTool(new TodoTools());
        System.out.println("ok");
    }
}
