package com.lucky.server.config;

import com.lucky.server.handler.AudioWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer{

    private final AudioWebSocketHandler audioHandler;


    public WebSocketConfig(AudioWebSocketHandler audioHandler){
        this.audioHandler = audioHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(audioHandler,"/asia/audio")
                .setAllowedOrigins("*");
    }
}