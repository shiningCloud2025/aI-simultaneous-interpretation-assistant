package com.lucky.server;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.context.annotation.Bean;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * @author shiningCloud2025
 */

@RefreshScope
@EnableDiscoveryClient
@MapperScan("com.lucky.server.mapper")
@SpringBootApplication
public class AiAssistantServerApplication{
    public static void main(String[] args) {
        SpringApplication.run(AiAssistantServerApplication.class, args);
    }


    /**
     * 启动自检：Redis 连不上则启动失败
     * @author shiningCloud2025
     */
    @Bean
    public CommandLineRunner redisHealthCheck(StringRedisTemplate stringRedisTemplate) {
        return args -> {
            String pong = stringRedisTemplate.getConnectionFactory()
                    .getConnection().ping();
            if (!"PONG".equals(pong)) {
                throw new IllegalStateException("Redis 连接异常，PING 响应：" + pong);
            }
            System.out.println("=== Redis 连接成功 === PONG");
        };
    }
}