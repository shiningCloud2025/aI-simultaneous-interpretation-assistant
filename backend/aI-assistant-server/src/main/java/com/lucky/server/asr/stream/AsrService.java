package com.lucky.server.asr.stream;
/**
 * ASR服务接口
 * @author shiningCloud2025
 */
public interface AsrService {
    void start(AsrConfig config,AsrCallback callBack);
    void sendAudio(byte[] pcmChunk);
    void stop();

    /** ASR 连接是否已就绪（收到首个服务端结果） */
    boolean isReady();

}
