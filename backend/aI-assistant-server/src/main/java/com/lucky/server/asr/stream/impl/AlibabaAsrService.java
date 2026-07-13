package com.lucky.server.asr.stream.impl;

import com.alibaba.dashscope.audio.asr.recognition.Recognition;
import com.alibaba.dashscope.audio.asr.recognition.RecognitionParam;
import com.alibaba.dashscope.audio.asr.recognition.RecognitionResult;
import com.alibaba.dashscope.common.ResultCallback;
import com.alibaba.dashscope.utils.Constants;
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

    @Override
    public void start(AsrConfig config, AsrCallback callBack) {
        this.callback = callBack;

        // 不同地域的 WebSocket 地址不同，默认北京
        Constants.baseWebsocketApiUrl = config.getWsUrl();
        RecognitionParam param = RecognitionParam.builder()
                .model(config.getModel())
                .apiKey(config.getApiKey())
                .format(config.getFormat())
                .sampleRate(config.getSampleRate())
                .build();

        this.recognition = new Recognition();

        ResultCallback<RecognitionResult> internalCallback = new ResultCallback<RecognitionResult>() {
            @Override
            public void onEvent(RecognitionResult result) {
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
            }
        };

        try{
            recognition.call(param,internalCallback);
        }catch (Exception e){
            log.error("[AlibabaAsr] 启动失败", e);
            callback.onError(e);
        }

    }

    @Override
    public void sendAudio(byte[] pcmChunk) {
        if (recognition == null) {
            return;
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
