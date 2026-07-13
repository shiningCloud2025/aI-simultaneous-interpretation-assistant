package com.lucky.server.asr.stream;
/**
 * ASR 识别结果回调
 * @author shiningCloud2025
 */
public interface  AsrCallback {
    /** 中间结果（实时预览） */
    void onInterimResult(String text);

    /** 一句话结束的最终结果 */
    void onFinalResult(String text);

    /** 识别出错 */
    void onError(Exception e);

    /** 识别完成 */
    void onComplete();
}
