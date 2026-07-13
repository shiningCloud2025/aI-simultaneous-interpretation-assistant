package com.lucky.server.asr;
/**
 * ASR服务接口
 * @author shiningCloud2025
 */
public interface AsrService {
    void start(AsrConfig config,AsrCallback callBack);
    void sendAudio(byte[] pcmChunk);
    void stop();
}
