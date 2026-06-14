# AI 同声传译助手 - 技术方案 V1.0

## 一、项目背景

### 1.1 用户痛点

在日常工作和学习中，用户经常需要观看英语（或其他外语）演讲、技术分享、国际会议或网课。以下痛点普遍存在：

| 痛点 | 场景 | 影响 |
|---|---|---|
| **语言门槛高** | 非英语母语者听英文技术分享 | 跟不上内容节奏，遗漏关键信息 |
| **实时性差** | 传统同传依赖人工，成本高且稀缺 | 绝大部分线上内容没有实时翻译 |
| **翻译不准且无修正** | 机器翻译逐句输出，无法回头纠错 | 前面翻错了就错了，误导理解 |
| **信息密度大** | 技术演讲术语多、语速快 | 靠字幕软件也跟不上 |
| **无法回溯** | 没有字幕记录 | 听完无法回顾要点 |

### 1.2 竞品对比

| 产品 | 类型 | 实时性 | 纠错 | 适用场景 | 不足 |
|---|---|---|---|---|---|
| Zoom 同传 | C/S | ✅ 实时 | ❌ 无 | 视频会议内 | 仅 Zoom 生态，需人工 |
| YouTube 自动字幕 | B/S | ⚠️ 延迟高 | ❌ 无 | YouTube 视频 | 不通用，不翻中文 |
| 讯飞听见 | App | ✅ 实时 | ❌ 无 | 中文语音转文字 | 不翻译，收费 |
| DeepL / 百度翻译 | Web | ❌ 逐句 | ❌ 无 | 文字翻译 | 不处理语音 |
| 华为 AI 字幕 | 系统级 | ⚠️ 有限 | ❌ 无 | 手机媒体音频 | 仅华为设备 |

**核心差异化：本方案做到"语音→实时翻译→自动纠错"一条龙，Web 端开箱即用，不依赖特定平台。**

---

## 二、技术选型

| 层面 | 技术 | 说明 |
|---|---|---|
| 语言 | Java 21 | LTS 版本 |
| 框架 | Spring Boot 3.3.6 | Web 服务基础 |
| 实时通信 | WebSocket (RFC 6455) | 音频流传输 + 字幕推送 |
| AI 框架 | AgentScope Java | 单模型调用 + 多 Agent 纠错编排 |
| 配置中心 | Nacos | 多环境配置管理 |
| 数据库 | MySQL + MyBatis-Plus 3.5.7 | 会话记录、字幕历史 |
| API 文档 | Knife4j 4.4.0 | Swagger UI |
| 日志 | Logback | 环境分级日志 |

---

## 三、核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器前端                             │
│  getUserMedia() → AudioContext → PCM Int16 → WebSocket 发送   │
│  WebSocket 接收 → 字幕渲染 + 修正闪烁                         │
└───────────────────────┬─────────────────────────────────────┘
                        │  ws://host/api/asia/audio
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    Spring Boot 后端                          │
│                                                             │
│  AudioWebSocketHandler (BinaryWebSocketHandler)             │
│    ├─ 接收 PCM 二进制帧                                      │
│    ├─ 缓冲区积攒 (ByteArrayOutputStream)                     │
│    ├─ 3秒固定时长切句                                        │
│    └─ flushBuffer → 调模型                                   │
│                                                             │
│  AudioService (ASR/翻译)                                    │
│    ├─ PCM → WAV 格式转换                                     │
│    ├─ 方案A: Qwen3 Audio (端到端 语音→中文)                  │
│    └─ 方案B: Whisper → LLM翻译 → 纠错 (流水线)               │
│                                                             │
│  CorrectionService (纠错)                                   │
│    ├─ 上下文窗口 (前 N 句)                                   │
│    └─ AgentScope 多 Agent 编排                               │
│                                                             │
│  ←── WebSocket 推送字幕 JSON ──── 前端渲染                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、两套翻译方案

### 方案A：端到端语音大模型

```
PCM → WAV → Qwen3 Audio (语音→中文) → LLM 纠错 → 字幕
```

| 优点 | 缺点 |
|---|---|
| 链路短，延迟低 | 需确认是否支持流式输入 |
| 代码量少 | API 稳定性待验证 |

### 方案B：ASR + 翻译 三级流水线

```
PCM → WAV → Whisper (语音→文本) → 机器翻译 → LLM 纠错 → 字幕
```

| 优点 | 缺点 |
|---|---|
| 每步独立可替换 | 三级级联，延迟累加 |
| Whisper 成熟稳定 | 代码量大 |

> 通过策略模式 + 配置切换，两套方案共存，按需选择。

---

## 五、音频处理链路

```
前端采集                    WebSocket 后端               处理
  │                           │                         │
  │── PCM chunk (256ms) ────→│  buffer.write()          │
  │── PCM chunk ────────────→│  buffer.write()          │
  │── PCM chunk ────────────→│  buffer.size >= 96000?   │
  │                           │  → flushBuffer()        │
  │                           │    PCM + WAV头 → 模型    │
  │←── 字幕 JSON ───────────│                           │
```

### 音频参数

| 参数 | 值 | 说明 |
|---|---|---|
| 采样率 | 16000 Hz | ASR 行业标准 |
| 位深 | 16 bit | PCM 标准 |
| 声道 | 单声道 | 语音识别不需要立体声 |
| 切句间隔 | 3 秒 | ≈ 96000 字节一切 |

---

## 六、纠错机制

**为什么需要纠错？** 同传场景中，语音识别和翻译都是"盲打"，没有完整上下文容易出错。比如"Apple"可能被翻成"苹果"而不是"苹果公司"——拿到后文才知正确含义。

```
当前句翻译 ──→ 纠错Agent (语义检查) ──→ 补充Agent (上下文补全)
                   │                        │
                   └── 冲突裁决Agent ──→ 最终字幕 → WebSocket 推送
```

- 保留最近 **3~5 句** 作为上下文窗口
- AgentScope 多 Agent 协作编排
- 纠正在原字幕位置原地替换（闪烁修正效果）

---

## 七、项目结构

```
com.lucky.server
├── AiAssistantServerApplication.java    # 启动类
├── config/
│   └── WebSocketConfig.java            # WebSocket 配置
├── handler/
│   └── AudioWebSocketHandler.java      # 音频流处理（含缓冲区/切句）
├── service/
│   ├── AudioService.java               # 音频处理 (PCM → WAV)
│   ├── AsrService.java                 # 语音识别
│   ├── TranslationService.java         # 翻译服务
│   └── CorrectionService.java          # 纠错服务
├── model/
│   ├── SessionContext.java             # 会话上下文
│   └── TranslationResult.java          # 翻译结果
├── dto/
│   └── SubtitleMessage.java            # 字幕消息 DTO
└── docs/
    └── AI 同声传译助手 - 技术方案 V1.0.md
```

---

## 八、开发进度

| 阶段 | 内容 | 状态 |
|---|---|---|
| Phase 1 | Spring Boot 骨架、Nacos、数据库 | ✅ 完成 |
| Phase 2 | WebSocket 二进制音频收发 | ✅ 完成 |
| Phase 3 | 语音分块缓冲区 (3 秒切句) | ✅ 完成 |
| Phase 4 | PCM → WAV + 调语音大模型 | 🔨 开发中 |
| Phase 5 | LLM 纠错 + 字幕推送 | ⏳ 待开发 |
| Phase 6 | 前后端联调 + 优化 | ⏳ 待开发 |

---

## 九、下一步计划

1. 实现 PCM → WAV 格式转换工具类
2. 集成 AgentScope / 语音大模型 API
3. 实现字幕 WebSocket 下行推送
4. 实现纠错 Agent 编排
