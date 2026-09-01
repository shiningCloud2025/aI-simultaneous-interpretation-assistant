# AgentScope Java 智能体接入问题排查与修复

## 背景

项目在听力、写作、阅读模块中统一使用 AgentScope Java 2.0 的 `HarnessAgent` 接入大模型能力。

当前主要智能体包括：

| 模块 | Agent | 主要职责 |
|------|-------|----------|
| 听力 | TranslateAgent | ASR 原文增量翻译 |
| 听力 | CorrectionAgent | 原文与译文纠错 |
| 写作 | WritingCompositionGenerateAgent | 根据语言、学段、题型、难度、场景生成作文题目 |
| 写作 | WritingCompositionEvaluateAgent | 支持文本作文和图片作文批阅 |
| 阅读 | ReadingWordMaterialGenerateAgent | 根据单词、语言和学习阶段生成例句与图片辅助材料 |

本次排查主要解决了五类问题：

1. 结构化输出读取失败。
2. 工具调用与结构化输出组合导致请求变慢或卡住。
3. 固定会话导致历史上下文膨胀，图片作文批阅请求超时。
4. 图片作文批阅依赖模型视觉能力。
5. Agent 缓存导致切换模型不生效。

## 问题一：结构化输出读取失败

### 现象

模型实际已经返回了 JSON 文本，但后端仍然抛出异常：

```text
No structured output in message metadata. Key '_structured_output' not found.
```

日志中可以看到模型返回内容类似：

````text
POST_CALL | response: ```json
{
  "score": 60,
  "feedback": "...",
  "suggestion": "..."
}
```
````

说明模型调用成功，失败点不是模型无响应，而是业务代码直接从 AgentScope 的结构化元数据中取结果。

### 根因

原逻辑直接调用：

```java
msg.getStructuredData(WritingCompositionEvaluateResultVO.class)
```

但当模型没有通过框架原生结构化输出机制返回，或者关闭了原生结构化输出能力后，AgentScope 返回的 `Msg` 里可能只有普通文本内容，没有 `_structured_output` 元数据。

此时即使文本内容是合法 JSON，`getStructuredData()` 仍然会失败。

### 解决方式

结构化结果读取要增加兜底策略：

1. 优先读取 `msg.hasStructuredData()`。
2. 如果没有结构化元数据，则读取 `msg.getTextContent()`。
3. 从文本中提取 JSON。
4. 使用 `ObjectMapper` 反序列化成目标 VO。

参考写法：

```java
private WritingCompositionEvaluateResultVO parseResult(Msg msg) {
    if (msg.hasStructuredData()) {
        WritingCompositionEvaluateResultVO result = msg.getStructuredData(WritingCompositionEvaluateResultVO.class);
        if (result != null) {
            return result;
        }
    }

    String text = msg.getTextContent();
    if (text == null || text.isBlank()) {
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "作文评估结果为空");
    }

    try {
        return objectMapper.readValue(extractJson(text), WritingCompositionEvaluateResultVO.class);
    } catch (Exception e) {
        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "作文评估结果解析失败");
    }
}
```

JSON 提取方法需要兼容代码块：

```java
private String extractJson(String text) {
    String value = text.trim();

    if (value.startsWith("```")) {
        int firstLineEnd = value.indexOf('\n');
        int lastFence = value.lastIndexOf("```");
        if (firstLineEnd >= 0 && lastFence > firstLineEnd) {
            return value.substring(firstLineEnd + 1, lastFence).trim();
        }
    }

    int start = value.indexOf('{');
    int end = value.lastIndexOf('}');
    if (start >= 0 && end > start) {
        return value.substring(start, end + 1);
    }

    return value;
}
```

## 问题二：工具调用与结构化输出组合导致请求变慢

### 现象

作文生成、作文批阅等 Agent 注册了工具：

```java
Toolkit toolkit = new Toolkit();
toolkit.registerTool(new TodoTools());
```

同时又要求模型输出结构化对象。部分模型在 `tools + structured output` 同时开启时，响应明显变慢，甚至出现长时间无结果。

### 根因

部分 OpenAI 兼容模型对工具调用和原生结构化输出的组合支持不稳定。

在 AgentScope Java 中，如果启用原生结构化输出并同时保留工具，底层请求可能会走模型厂商的原生约束能力。不同厂商、不同模型对该能力的支持程度不同，容易出现兼容问题。

### 解决方式

在保留工具能力的前提下，关闭“工具场景下的原生结构化输出”，让框架或业务层通过普通 JSON 文本完成结构化解析：

```java
OpenAIChatModel model = OpenAIChatModel.builder()
        .apiKey(apiKey)
        .modelName(modelName)
        .baseUrl(baseUrl)
        .stream(false)
        .nativeStructuredOutputWithTools(false)
        .generateOptions(
                GenerateOptions.builder()
                        .temperature(0.3)
                        .build()
        )
        .build();
```

同时业务层必须保留“文本 JSON 兜底解析”，不能只依赖 `getStructuredData()`。

### 注意事项

- `nativeStructuredOutputWithTools(false)` 不代表不需要结构化输出，而是避免让厂商原生能力处理 `tools + structured output` 的组合。
- Prompt 中仍然要明确要求输出严格 JSON。
- 后端仍然使用 VO 作为最终业务返回对象。

## 问题三：固定会话导致图片批阅请求超时

### 现象

作文图片批阅出现 180 秒超时：

```text
AsyncRequestTimeoutException
HTTP request interrupted
```

对应日志：

```text
PRE_REASONING | model=qwen3.6-plus, messages=16
```

说明请求进入模型前，已经携带了较多历史消息。

### 根因

作文批阅原先使用固定会话：

```java
.sessionId("writing_composition_evaluate_" + userId)
```

同一个用户多次批阅会复用同一个 Agent 会话。AgentScope 会把历史上下文、历史评估 JSON、Memory 上下文等内容一并带入下一次请求。

图片作文批阅本身需要模型识图，耗时高于普通文本请求；如果再带入大量历史上下文，就容易触发 Spring MVC 异步请求超时，并中断底层模型 HTTP 请求。

### 解决方式

作文批阅属于单次评估任务，不强依赖上一轮上下文。第一版可以使用一次请求一个新会话，避免历史上下文膨胀：

```java
RuntimeContext ctx = RuntimeContext.builder()
        .userId(String.valueOf(userId))
        .sessionId("writing_composition_evaluate_" + userId + "_" + UUID.randomUUID())
        .build();
```

需要引入：

```java
import java.util.UUID;
```

这样每次批阅都只携带当前题干、评分标准、作文正文或图片，不再把之前多轮评估结果一起发给模型。

### 适用策略

| 场景 | 推荐会话策略 | 原因 |
|------|--------------|------|
| 实时翻译 | 固定会话 | 需要保留上下文，使增量翻译连贯 |
| 翻译纠错 | 固定会话或按业务会话 | 需要一定上下文，但要控制长度 |
| 作文生成 | 可固定，也可按请求 | 生成题目对历史依赖较弱 |
| 作文批阅 | 按请求新会话 | 单次任务，历史上下文容易造成干扰 |
| 单词材料生成 | 可按用户和模型缓存 Agent，但请求上下文保持轻量 | 同词可通过业务表复用，不依赖长对话 |

## 问题四：图片作文批阅依赖模型视觉能力

### 现象

同一张图片，普通模型可能返回：

```text
无法识别图片内容。请提供图片或描述图片中的文字内容。
```

而视觉模型可以正常识别作文正文并完成批阅。

### 根因

前端上传、COS 图片 URL、多模态消息构造都可能是正确的，但最终能否识别图片取决于当前用户选择的模型是否支持视觉输入。

普通 LLM 即使使用 OpenAI 兼容接口，也不一定具备图片理解能力。

### 解决方式

图片作文批阅要优先选择已验证支持视觉能力的模型，例如：

```text
qwen-vl-plus
```

或项目中已经验证可用的视觉模型。

后端多模态消息构造需要使用文本块加图片块：

```java
List<ContentBlock> blocks = new ArrayList<>();

blocks.add(TextBlock.builder()
        .text(input)
        .build());

for (String imageUrl : dto.imageUrls()) {
    blocks.add(ImageBlock.builder()
            .source(URLSource.builder()
                    .url(imageUrl)
                    .build())
            .build());
}

return UserMessage.builder()
        .content(blocks)
        .build();
```

### 后续优化

后续可以在模型配置中补充输入能力标识：

```yaml
inputs:
  - TEXT
  - IMG
  - VIDEO
```

前端在图片作文批阅场景只展示支持 `IMG` 的模型，避免用户误选普通文本模型。

## 问题五：Agent 缓存导致切换模型不生效

### 现象

前端切换模型后，后端仍然继续使用旧模型。

### 根因

原先 Agent 缓存只按用户维度保存：

```java
Map<Long, HarnessAgent> agentCache
```

用户切换模型后，缓存中已经存在旧 Agent，`computeIfAbsent` 不会重新构建，导致模型偏好变化没有立即生效。

### 解决方式

将缓存 key 改为用户 + 厂商 + 模型：

```java
private final Map<String, HarnessAgent> agentCache = new ConcurrentHashMap<>();

private String buildCacheKey(Long userId, SysUserModelPreferenceVO llmPreference) {
    return userId + ":" + llmPreference.provider() + ":" + llmPreference.modelName();
}
```

使用方式：

```java
SysUserModelPreferenceVO llmPreference = getLlmPreference(userId);
String cacheKey = buildCacheKey(userId, llmPreference);
HarnessAgent agent = agentCache.computeIfAbsent(cacheKey, key -> buildAgent(userId));
```

听力实时翻译由于还存在前端 WebSocket 会话维度，可以进一步使用：

```text
userId:sessionId:direction:provider:modelName
```

这样同一用户可以在不同实时会话、不同方向、不同模型之间隔离 Agent 状态。

## 推荐实践

### 1. 结构化输出不要只依赖框架元数据

只要模型最终输出是文本，就应保留 JSON 文本兜底解析能力。

推荐读取顺序：

```text
hasStructuredData()
  -> getStructuredData()
  -> getTextContent()
  -> extractJson()
  -> objectMapper.readValue()
```

### 2. 单次任务避免固定长期会话

作文批阅、单词材料生成等任务本质是独立请求，不应默认把历史评估结果带入下一轮。

实时翻译、纠错这类需要上下文连续性的任务，才更适合固定业务会话。

### 3. 图片任务必须校验模型能力

图片作文批阅、OCR、图像理解都应选择支持 `IMG` 输入的模型。普通文本模型不应承担图片识别任务。

### 4. 工具能力可以保留，但要控制原生结构化输出

项目希望保留 `TodoTools` 等工具能力，因此不要简单删除工具。更合理的方式是关闭不稳定的原生组合能力，并在业务层做 JSON 解析兜底。

### 5. 评分标准要在 Prompt 中明确量纲

如果评分标准为“满分15分”，应要求模型返回 0 到 15 的分数；如果是百分制，应返回 0 到 100 的分数。

推荐 Prompt 片段：

```text
请严格按照评分标准的满分值给出 score。
如果评分标准为“满分15分”，score 必须为 0-15 之间的数字；
如果评分标准为“百分制”，score 必须为 0-100 之间的数字。
```

## 当前验证结论

1. 后端多模态图片作文批阅链路已经打通。
2. COS 图片 URL 可以被视觉模型读取。
3. `qwen-vl-plus` 等视觉模型可正常识别图片作文内容。
4. 结构化输出需要保留文本 JSON 解析兜底。
5. 固定会话会导致历史上下文膨胀，作文批阅建议改为请求级会话。
6. Agent 缓存需要包含 provider 和 modelName，否则前端切换模型后不会立即生效。
