package com.lucky.server.asr.stream.impl;

import com.alibaba.dashscope.audio.asr.recognition.Recognition;
import com.alibaba.dashscope.audio.asr.recognition.RecognitionParam;
import com.alibaba.dashscope.audio.asr.recognition.RecognitionResult;
import com.alibaba.dashscope.common.ResultCallback;
import com.alibaba.dashscope.utils.Constants;
import com.google.gson.Gson;
import com.lucky.server.asr.stream.AsrCallback;
import com.lucky.server.asr.stream.AsrConfig;
import com.lucky.server.asr.stream.AsrService;
import lombok.extern.slf4j.Slf4j;

import java.nio.ByteBuffer;

/**
 * 阿里实时语音识别实现
 * @author shiningCloud2025
 */
@Slf4j
public class AlibabaAsrService implements AsrService {

    private Recognition recognition;
    private AsrCallback callback;
    private AsrConfig config;   // 保存配置，用于断线重连

    private int audioFrameCount = 0;
    /** ASR 连接是否已就绪（收到首个服务端结果后置 true） */
    private volatile boolean ready = false;

    @Override
    public void start(AsrConfig config, AsrCallback callBack) {
        this.callback = callBack;
        this.config = config;

        // 不同地域的 WebSocket 地址不同，默认北京
        Constants.baseWebsocketApiUrl = config.getWsUrl();
        connect();
    }

    /**
     * 建立/重建与阿里 ASR 的 WebSocket 连接
     * （超时或出错后可通过 reconnect() 复用本方法重建连接）
     */
    private void connect() {
        RecognitionParam param = RecognitionParam.builder()
                .model(config.getModel())
                .apiKey(config.getApiKey())
                .format(config.getFormat())
                .sampleRate(config.getSampleRate())
                // 关键：开启心跳，静音/停顿时不因超时断连（默认 false 会 23 秒超时断开）
                .parameter("heartbeat", true)
                .parameter("language_hints", new String[]{config.getLanguage()})
                .build();

        ready = false;
        this.recognition = new Recognition();

        ResultCallback<RecognitionResult> internalCallback = new ResultCallback<RecognitionResult>() {
            @Override
            public void onEvent(RecognitionResult result) {
                ready = true;   // 收到任意结果，说明 ASR 连接已就绪
                if (result.getSentence() == null){
                    return ;
                }
                String text = result.getSentence().getText();
                if(text == null || text.isEmpty()){
                    return;                          // 空的跳过
                }
                if(result.isSentenceEnd()){
                    callback.onFinalResult(text);    // 句子结束 → 最终结果
                }else{
                    callback.onInterimResult(text);  // 中间结果
                }
            }

            @Override
            public void onComplete() {
                callback.onComplete();
            }

            @Override
            public void onError(Exception e) {
                log.error("[AlibabaAsr] 识别出错", e);
                callback.onError(e);
                // 断线/超时后尝试重建连接，避免本会话 ASR 永久失效
                reconnect();
            }
        };

        try{
            log.info("[AlibabaAsr] 连接参数: model={}, language={}, heartbeat=true",
                    config.getModel(), config.getLanguage());
            log.info("[AlibabaAsr] 完整请求参数 JSON: {}", new Gson().toJson(param.getParameters()));
            recognition.call(param,internalCallback);
        }catch (Exception e){
            log.error("[AlibabaAsr] 启动失败", e);
            callback.onError(e);
            reconnect();
        }
    }

    /**
     * 延迟重建连接（带 0.5s 防抖，避免服务端未释放时疯狂重连）
     */
    private void reconnect() {
        try {
            Thread.sleep(500);   // 等 0.5s 再重连，避免服务端未释放
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
        try {
            connect();
            log.info("[AlibabaAsr] ASR 连接已重建");
        } catch (Exception e) {
            log.error("[AlibabaAsr] ASR 重连失败", e);
        }
    }

    @Override
    public boolean isReady() {
        return ready;
    }


    @Override
    public void sendAudio(byte[] pcmChunk) {
        if (recognition == null) {
            return;
        }
        audioFrameCount++;
        if (audioFrameCount <= 3 || audioFrameCount % 100 == 0) {
            log.info("[AlibabaAsr] sendAudio 第{}帧, 字节数={}", audioFrameCount, pcmChunk.length);
        }
        try{
            recognition.sendAudioFrame(ByteBuffer.wrap(pcmChunk));
        }catch (Exception e){
            log.error("[AlibabaAsr] 发送音频失败", e);
        }
    }

    @Override
    public void stop() {
        if (recognition == null) {
            return;
        }
        try {
            recognition.stop();
            recognition.getDuplexApi().close(1000, "bye");
        } catch (Exception e) {
            log.error("[AlibabaAsr] 停止失败", e);
        }
    }
}
