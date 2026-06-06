package com.lucky.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.context.config.annotation.RefreshScope;

/**
 * @author shiningCloud2025
 */

@RefreshScope
@EnableDiscoveryClient
@SpringBootApplication
public class AiAssistantServerApplication{
    public static void main(String[] args) {
        SpringApplication.run(AiAssistantServerApplication.class, args);
    }
}