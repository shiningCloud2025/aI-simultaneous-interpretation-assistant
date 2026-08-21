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
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

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
    /** ASR 音频发送队列容量，约可缓存 25 秒 128ms 帧，防止网络抖动时撑爆内存 */
    private static final int AUDIO_QUEUE_CAPACITY = 200;
    /** SDK call 返回后 run-task 仍会异步下发，稍等一小段时间再开始发音频 */
    private static final long START_SEND_DELAY_MS = 500L;
    /** 16-bit PCM 单声道，每个采样点 2 字节 */
    private static final int PCM_BYTES_PER_SAMPLE = 2;
    /** 前端音频帧统一进入队列，再由单线程顺序写给 DashScope SDK */
    private final BlockingQueue<byte[]> audioQueue = new ArrayBlockingQueue<>(AUDIO_QUEUE_CAPACITY);
    private Thread senderThread;
    /** ASR SDK 回调线程只负责投递事件，业务处理放到独立线程，避免阻塞后续识别回调 */
    private ExecutorService callbackExecutor;
    private volatile long readyAtMillis = 0L;
    private long lastSendAtMillis = 0L;
    /** ASR 连接是否已就绪（SDK call 成功后即可接收音频帧） */
    private volatile boolean ready = false;
    /** 当前会话是否已被主动停止，避免关闭后被错误回调重新拉起 */
    private volatile boolean stopped = false;
    /** 重连中的防抖标记，避免连续发送失败时创建多个 ASR 连接 */
    private volatile boolean reconnecting = false;

    @Override
    public void start(AsrConfig config, AsrCallback callBack) {
        this.callback = callBack;
        this.config = config;
        this.stopped = false;
        this.audioFrameCount = 0;
        this.lastSendAtMillis = 0L;
        this.audioQueue.clear();
        this.callbackExecutor = Executors.newSingleThreadExecutor(r -> {
            Thread thread = new Thread(r, "alibaba-asr-callback-worker");
            thread.setDaemon(true);
            return thread;
        });

        // 不同地域的 WebSocket 地址不同，默认北京
        Constants.baseWebsocketApiUrl = config.getWsUrl();
        connect();
        startSenderThread();
    }

    /**
     * 建立/重建与阿里 ASR 的 WebSocket 连接
     * （超时或出错后可通过 reconnect() 复用本方法重建连接）
     */
    private void connect() {
        if (stopped) {
            return;
        }
        closeCurrentRecognition();
        RecognitionParam param = buildRecognitionParam();

        ready = false;
        readyAtMillis = 0L;
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
                log.info("[AlibabaAsr] 识别结果: sentenceEnd={}, text={}", result.isSentenceEnd(), text);
                if(result.isSentenceEnd()){
                    dispatchCallback(() -> callback.onFinalResult(text));    // 句子结束 → 最终结果
                }else{
                    dispatchCallback(() -> callback.onInterimResult(text));  // 中间结果
                }
            }

            @Override
            public void onComplete() {
                ready = false;
                readyAtMillis = 0L;
                dispatchCallback(callback::onComplete);
            }

            @Override
            public void onError(Exception e) {
                ready = false;
                readyAtMillis = 0L;
                if (stopped) {
                    return;
                }
                log.error("[AlibabaAsr] 识别出错", e);
                dispatchCallback(() -> callback.onError(e));
                // 断线/超时后尝试重建连接，避免本会话 ASR 永久失效
                reconnect();
            }
        };

        try{
            log.info("[AlibabaAsr] 连接参数: model={}, language={}, heartbeat=true",
                    config.getModel(), config.getLanguage() == null ? "auto" : config.getLanguage());
            log.info("[AlibabaAsr] 完整请求参数 JSON: {}", new Gson().toJson(param.getParameters()));
            recognition.call(param,internalCallback);
            ready = true;
            readyAtMillis = System.currentTimeMillis() + START_SEND_DELAY_MS;
            log.info("[AlibabaAsr] ASR 连接已启动，{}ms 后开始顺序发送音频帧", START_SEND_DELAY_MS);
        }catch (Exception e){
            ready = false;
            readyAtMillis = 0L;
            if (stopped) {
                return;
            }
            log.error("[AlibabaAsr] 启动失败", e);
            callback.onError(e);
            reconnect();
        }
    }

    /**
     * 延迟重建连接（带 0.5s 防抖，避免服务端未释放时疯狂重连）
     */
    private void reconnect() {
        if (stopped || reconnecting) {
            return;
        }
        reconnecting = true;
        Thread reconnectThread = new Thread(() -> {
            try {
                Thread.sleep(500);   // 等 0.5s 再重连，避免服务端未释放
                connect();
                log.info("[AlibabaAsr] ASR 连接已重建");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("[AlibabaAsr] ASR 重连失败", e);
            } finally {
                reconnecting = false;
            }
        }, "alibaba-asr-reconnect");
        reconnectThread.setDaemon(true);
        reconnectThread.start();
    }

    /**
     * 构建 DashScope 识别参数。language 为空时不传 language_hints，让模型自动判断语种。
     */
    private RecognitionParam buildRecognitionParam() {
        RecognitionParam.RecognitionParamBuilder builder = RecognitionParam.builder()
                .model(config.getModel())
                .apiKey(config.getApiKey())
                .format(config.getFormat())
                .sampleRate(config.getSampleRate())
                // 关键：开启心跳，静音/停顿时不因超时断连（默认 false 会 23 秒超时断开）
                .parameter("heartbeat", true)
                .parameter("max_sentence_silence", 6000);

        if (config.getLanguage() != null && !config.getLanguage().isBlank()) {
            builder.parameter("language_hints", new String[]{config.getLanguage()});
        }
        return builder.build();
    }

    @Override
    public boolean isReady() {
        return ready;
    }


    @Override
    public void sendAudio(byte[] pcmChunk) {
        if (pcmChunk == null || pcmChunk.length == 0 || stopped) {
            return;
        }
        byte[] frame = pcmChunk.clone();
        if (!audioQueue.offer(frame)) {
            audioQueue.poll();
            audioQueue.offer(frame);
            log.warn("[AlibabaAsr] 音频发送队列已满，丢弃最旧帧以保持实时性");
        }
    }

    @Override
    public void stop() {
        stopped = true;
        ready = false;
        readyAtMillis = 0L;
        audioQueue.clear();
        if (callbackExecutor != null) {
            callbackExecutor.shutdownNow();
            callbackExecutor = null;
        }
        if (senderThread != null) {
            senderThread.interrupt();
            senderThread = null;
        }
        Recognition current = recognition;
        recognition = null;
        if (current == null) {
            return;
        }
        try {
            current.stop();
            current.getDuplexApi().close(1000, "bye");
        } catch (Exception e) {
            log.error("[AlibabaAsr] 停止失败", e);
        }
    }

    /**
     * 启动会话级发送线程，保证所有音频帧按顺序写入 DashScope SDK。
     */
    private void startSenderThread() {
        if (senderThread != null && senderThread.isAlive()) {
            return;
        }
        senderThread = new Thread(this::sendAudioLoop, "alibaba-asr-audio-sender");
        senderThread.setDaemon(true);
        senderThread.start();
    }

    /**
     * 将 SDK 回调转交给业务线程，避免翻译、推送等后续逻辑阻塞 ASR 的 OkHttp 回调线程。
     */
    private void dispatchCallback(Runnable task) {
        ExecutorService executor = callbackExecutor;
        if (executor == null || executor.isShutdown()) {
            return;
        }
        executor.submit(task);
    }

    /**
     * 顺序发送音频帧。SDK 的 run-task 是异步发出的，所以 readyAtMillis 之前先攒帧不发送。
     */
    private void sendAudioLoop() {
        while (!stopped && !Thread.currentThread().isInterrupted()) {
            try {
                byte[] frame = audioQueue.poll(200, TimeUnit.MILLISECONDS);
                if (frame == null) {
                    continue;
                }
                waitUntilReady();
                if (stopped) {
                    return;
                }
                Recognition current = recognition;
                if (current == null || !ready) {
                    offerBack(frame);
                    continue;
                }
                throttleByAudioDuration(frame);
                sendFrame(current, frame);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * 等待 ASR 连接进入可发送窗口。
     */
    private void waitUntilReady() throws InterruptedException {
        while (!stopped && (!ready || System.currentTimeMillis() < readyAtMillis)) {
            Thread.sleep(20);
        }
    }

    /**
     * 当前 ASR 连接不可用时把帧放回队列尾部，等待重连后继续发送。
     */
    private void offerBack(byte[] frame) {
        if (!audioQueue.offer(frame)) {
            log.warn("[AlibabaAsr] 重放音频帧失败，发送队列已满");
        }
    }

    /**
     * 发送单个 PCM 帧并记录必要的排障日志。
     */
    private void sendFrame(Recognition current, byte[] pcmChunk) {
        audioFrameCount++;
        if (audioFrameCount <= 5 || audioFrameCount % 50 == 0) {
            int nonZero = 0;
            for (byte b : pcmChunk) {
                if (b != 0) nonZero++;
            }
            log.info("[AlibabaAsr] 发送第{}帧, 字节数={}, 非零字节={}/{}, 队列剩余={}",
                    audioFrameCount, pcmChunk.length, nonZero, pcmChunk.length, audioQueue.size());
        }
        try {
            current.sendAudioFrame(ByteBuffer.wrap(pcmChunk));
            lastSendAtMillis = System.currentTimeMillis();
        } catch (Exception e) {
            ready = false;
            readyAtMillis = 0L;
            offerBack(pcmChunk);
            log.error("[AlibabaAsr] 发送音频失败", e);
            reconnect();
        }
    }

    /**
     * 按 PCM 帧的实际音频时长限速发送，避免启动阶段或网络抖动后把多帧音频瞬间灌给 ASR。
     */
    private void throttleByAudioDuration(byte[] pcmChunk) throws InterruptedException {
        if (lastSendAtMillis <= 0) {
            return;
        }
        long frameDurationMs = Math.max(20L,
                pcmChunk.length * 1000L / Math.max(1, config.getSampleRate() * PCM_BYTES_PER_SAMPLE));
        long nextSendAt = lastSendAtMillis + frameDurationMs;
        long waitMs = nextSendAt - System.currentTimeMillis();
        if (waitMs > 0) {
            Thread.sleep(waitMs);
        }
    }

    /**
     * 重建 ASR 连接前释放旧连接，避免异常重连后残留旧 WebSocket。
     */
    private void closeCurrentRecognition() {
        Recognition current = recognition;
        if (current == null) {
            return;
        }
        try {
            current.stop();
            current.getDuplexApi().close(1000, "reconnect");
        } catch (Exception e) {
            log.warn("[AlibabaAsr] 释放旧连接失败: {}", e.getMessage());
        }
    }
}
