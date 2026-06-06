package com.lucky.server.handler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.nio.ByteBuffer;

@Slf4j
@Component
public class AudioWebSocketHandler extends BinaryWebSocketHandler {
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket连接建立: {}", session.getId());
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        ByteBuffer buf = message.getPayload();
        byte[] chunk = new byte[buf.remaining()];
        buf.get(chunk);
        log.info("收到音频块: {} 字节, session={}", chunk.length, session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket连接断开: {}, 状态: {}", session.getId(), status);
    }


}
