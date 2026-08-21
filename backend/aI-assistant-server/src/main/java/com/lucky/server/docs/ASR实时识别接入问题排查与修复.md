# ASR 实时识别接入问题排查与修复

## 背景

项目的实时转译链路为：

```text
浏览器麦克风/屏幕音频
  -> Web Audio 采集并转 PCM
  -> 前端 WebSocket 二进制帧
  -> 后端 AudioWebSocketHandler
  -> AlibabaAsrService
  -> DashScope Fun-ASR-Realtime
  -> ASR 文本回调
  -> TranslateAgent 翻译
  -> WebSocket 推送前端
```

本次问题表现为：前端启动录音后，ASR 只能返回开头的一小段文本，例如 `Good`、`军`、`快`，后续即使持续说话，也不再连续返回识别结果。

## 现象与证据

前端控制台显示音频采集持续正常：

```text
[audio] frame 100 wsState=1 ctxRate=16000
[audio] rms=0.0442 peak=0.1020 frame=100
[audio] frame 500 wsState=1 ctxRate=16000
```

后端日志也证明 WebSocket 和 PCM 发送持续正常：

```text
[AlibabaAsr] 发送第500帧, 字节数=4096, 非零字节=4016/4096, 队列剩余=0
[AlibabaAsr] 发送第1000帧, 字节数=4096, 非零字节=4015/4096, 队列剩余=0
```

但 ASR 回调只有第一次：

```text
[AlibabaAsr] 识别结果: sentenceEnd=false, text=快
```

这说明问题不在浏览器采集，也不在前端 WebSocket 基础链路，而是在后端对 DashScope 实时 ASR SDK 的接入方式上。

## 根因

### 1. ASR SDK 回调线程被业务逻辑阻塞

原实现中，DashScope SDK 的 `onEvent` 回调里直接调用业务回调：

```text
DashScope onEvent
  -> callback.onInterimResult / onFinalResult
  -> AudioWebSocketHandler.handleAsrText
  -> WebSocket 推送
  -> TranslateAgent.translate
```

这会让 ASR SDK 的 OkHttp 回调线程承担后续推送和翻译逻辑。第一次识别结果进入翻译链路后，如果翻译 Agent、网络请求或 WebSocket 推送耗时较长，就可能阻塞 SDK 后续识别事件的派发。

修复后：SDK 回调线程只负责记录日志并把事件投递到独立业务线程，马上返回。

### 2. 音频帧发送缺少单线程顺序控制

原实现中，前端每个二进制 WebSocket 消息由 Tomcat 工作线程直接调用：

```java
recognition.sendAudioFrame(ByteBuffer.wrap(pcmChunk));
```

这会让多个请求线程直接写 DashScope SDK，存在时序和并发风险。实时 ASR 更适合按音频时间顺序、稳定节奏发送。

修复后：后端增加 ASR 会话级音频队列，由单独的 `alibaba-asr-audio-sender` 线程顺序发送。

### 3. 启动阶段音频帧过早/突发发送

DashScope 文档说明 `Recognition.call(param, callback)` 启动流式识别后，循环调用 `sendAudioFrame` 发送音频，建议每次发送约 100ms 音频，大小 1KB 到 16KB。

日志中可见 SDK 的 `run-task` 是异步发出的。原逻辑可能在 `run-task` 真正建立完成前就发送前几帧，或者重启后把积压帧瞬间打出去。

修复后：

- `call()` 返回后等待 500ms 再开始发送音频帧。
- 发送线程按照 PCM 帧的实际音频时长节流发送。4096 字节、16kHz、16-bit 单声道约为 128ms。

### 4. 不应从翻译方向强制推导 ASR 语种

原逻辑从 `direction=en-zh` 推导出：

```text
language_hints = ["en"]
```

但测试时可能实际说中文。DashScope 文档说明 `language_hints` 与实际音频语言不一致会导致识别异常。

修复后：ASR 默认不传 `language_hints`，让模型自动判断语种。翻译方向仍用于后续翻译，不再强行影响 ASR。

## 修复内容

### 前端修复

文件：

```text
frontend/web/src/components/RealTimeTrans.tsx
```

主要修改：

- 用 `ref` 持有 `GainNode`，避免静音输出节点被浏览器回收后音频图停止工作。
- 用 `ref` 持有屏幕共享的原始 `MediaStream` 和隐藏 `video`，避免扬声器/标签页音频捕获被释放。
- 停止录音时完整释放 WebSocket、AudioContext、MediaStream、隐藏 video。
- 设置 `ws.binaryType = 'arraybuffer'`。
- 保留 RMS/peak 日志用于判断是否仍有真实音频输入。

### 后端 WebSocket 修复

文件：

```text
backend/aI-assistant-server/src/main/java/com/lucky/server/handler/AudioWebSocketHandler.java
```

主要修改：

- 清理旧的 ASR 就绪前缓冲逻辑。
- WebSocket 收到音频帧后直接交给 `AsrService.sendAudio`。
- ASR 不再从翻译方向强制设置 `language_hints`，默认让模型自动识别语种。

### DashScope ASR 接入修复

文件：

```text
backend/aI-assistant-server/src/main/java/com/lucky/server/asr/stream/impl/AlibabaAsrService.java
```

主要修改：

- 增加音频发送队列。
- 增加单线程发送器，保证 PCM 帧顺序写入 DashScope SDK。
- 启动后延迟 500ms 再开始发送音频。
- 按 PCM 帧实际时长节流，避免突发灌帧。
- 增加独立 ASR 回调业务线程，避免 SDK 回调线程被翻译业务阻塞。
- 增加 `stopped`、`ready`、`reconnecting` 状态控制，避免停止后错误重连。
- 重连前释放旧 WebSocket，避免连接泄漏。
- 打印关键日志：连接参数、请求参数、音频帧、识别结果。

## 修复后的关键日志

后端启动 ASR：

```text
[AlibabaAsr] 连接参数: model=fun-asr-realtime, language=auto, heartbeat=true
[AlibabaAsr] 完整请求参数 JSON: {"max_sentence_silence":6000,"sample_rate":16000,"heartbeat":true,"format":"pcm","disfluency_removal_enabled":false}
[AlibabaAsr] ASR 连接已启动，500ms 后开始顺序发送音频帧
```

音频持续发送：

```text
[AlibabaAsr] 发送第1帧, 字节数=4096, 非零字节=4076/4096, 队列剩余=7
[AlibabaAsr] 发送第50帧, 字节数=4096, 非零字节=4042/4096, 队列剩余=0
```

ASR 连续返回：

```text
[AlibabaAsr] 识别结果: sentenceEnd=false, text=...
[AlibabaAsr] 识别结果: sentenceEnd=false, text=...
```

## 后续注意事项

1. 不要在 ASR SDK 的 `onEvent` 回调线程里直接做翻译、数据库、网络请求等耗时操作。
2. 实时音频要按时间顺序、接近真实音频时长发送，不要突发灌入。
3. `language_hints` 只有在明确知道输入语种时才传；中英混说或方向可能选错时应让模型自动识别。
4. `heartbeat=true` 仍需要持续发送静音音频，否则长时间静音会影响连接稳定性。
5. `ScriptProcessorNode` 已废弃，后续可迁移到 `AudioWorkletNode`，但本次问题根因不在这里。

## 验证命令

后端编译：

```bash
cd /Users/zhaoyunhan/PersonalJavaProject/aI-simultaneous-interpretation-assistant/backend/aI-assistant-server
mvn -q -DskipTests compile
```

前端单文件 lint：

```bash
cd /Users/zhaoyunhan/PersonalJavaProject/aI-simultaneous-interpretation-assistant/frontend/web
npx oxlint src/components/RealTimeTrans.tsx
```

