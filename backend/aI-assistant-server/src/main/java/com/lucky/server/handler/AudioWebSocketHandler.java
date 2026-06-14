package com.lucky.server.handler;

import com.lucky.server.util.AudioUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

import java.nio.ByteBuffer;

/**
 * @author shiningCloud2025
 */
@Slf4j
@Component
public class AudioWebSocketHandler extends BinaryWebSocketHandler {

    // 加在类里面，@Component 下面
    private static final int SAMPLE_RATE = 16000;
    private static final int BITS_PER_SAMPLE = 16;
    private static final int CHANNELS = 1;
    private static final int CHUNK_SECONDS = 3; // 每3秒切一句

    // 每个 session 一个缓冲区
    private final ConcurrentHashMap<String, ByteArrayOutputStream> bufferMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket连接建立: {}", session.getId());
        bufferMap.put(session.getId(), new ByteArrayOutputStream());
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws IOException {
        ByteBuffer buf = message.getPayload();
        byte[] chunk = new byte[buf.remaining()];
        buf.get(chunk);
        log.debug("收到音频块: {} 字节, session={}", chunk.length, session.getId());

        ByteArrayOutputStream buffer = bufferMap.get(session.getId());
        if (buffer == null) {
            return;
        }
        buffer.write(chunk);

        // 攒够3秒就切: 16000 * (16/8) * 3 = 96000 字节
        if (buffer.size() >= SAMPLE_RATE * (BITS_PER_SAMPLE / 8) * CHUNK_SECONDS) {
            flushBuffer(session.getId(), buffer);
        }
    }

    private void flushBuffer(String sessionId, ByteArrayOutputStream buffer) {
        byte[] pcm = buffer.toByteArray();
        buffer.reset();

        // PCM → WAV
        byte[] wav = AudioUtil.pcmToWav(pcm, SAMPLE_RATE, BITS_PER_SAMPLE, CHANNELS);
        log.info("切出语音片段: {} 字节 (PCM) → {} 字节 (WAV), session={}",
                pcm.length, wav.length, sessionId);

        // TODO: 加WAV头 → 调语音大模型
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        ByteArrayOutputStream buffer = bufferMap.remove(session.getId());
        if (buffer != null && buffer.size() > 0) {
            byte[] pcm = buffer.toByteArray();
            log.info("断开时剩余语音: {} 字节", pcm.length);
        }
        log.info("WebSocket连接断开: {}, 状态: {}", session.getId(), status);
    }


}
