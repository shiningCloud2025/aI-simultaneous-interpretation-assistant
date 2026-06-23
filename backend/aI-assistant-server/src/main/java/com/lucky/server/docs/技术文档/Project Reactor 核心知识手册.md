# Project Reactor 核心知识手册

> Spring 生态的响应式编程库。核心思想：**声明式异步编程 —— 你先描述"数据怎么流"，最后 `.subscribe()` 时才真正执行。**

---

## 一、Publisher 体系

```
Publisher<T>           ← 最顶层接口，能发出 0-N 个数据
  ├── Mono<T>          ← 0 或 1 个数据
  └── Flux<T>          ← 0 到 N 个数据
```

| | Mono | Flux |
|---|---|---|
| 数据量 | 0~1 | 0~N |
| 关键方法 | `block()` | `blockFirst()` / `blockLast()` |
| 对应现实 | HTTP 请求、DB 单条查询 | 事件流、消息队列、集合 |
| 互相转换 | `flux.single()` → Mono | `mono.flux()` → Flux |

---

## 二、创建数据流

### Mono 创建方式

```java
Mono.just(value);                          // 已有值
Mono.justOrEmpty(optionalValue);           // Optional，空则发空信号
Mono.fromCallable(() -> doSomething());    // 同步可能抛异常
Mono.fromSupplier(() -> computeValue());   // 延迟计算
Mono.fromRunnable(() -> sideEffect());     // 副作用，完成后发空
Mono.fromFuture(completableFuture);        // 从 Future 转
Mono.error(new RuntimeException("炸了"));  // 直接发错误信号
Mono.empty();                              // 发个空完成信号
Mono.never();                              // 永远不完成
Mono.defer(() -> Mono.just(now()));        // 每次订阅时才求值
Mono.create(sink -> {                      // 编程式创建
    sink.success("result");
    // 或 sink.error(e);
});
```

### Flux 创建方式

```java
Flux.just("a", "b", "c");                   // 固定值
Flux.fromIterable(list);                    // 从集合
Flux.fromArray(array);                      // 从数组
Flux.fromStream(stream);                    // 从 Stream
Flux.range(1, 100);                         // 1 到 100
Flux.interval(Duration.ofSeconds(1));       // 每秒发一个递增 Long
Flux.generate(sink -> sink.next(produce()));// 同步生成
Flux.create(sink -> {                       // 编程式创建，支持背压
    listener.onData(data -> sink.next(data));
    sink.onCancel(() -> listener.close());
});
Flux.error(new RuntimeException());         // 错误流
Flux.empty();                               // 空流
Flux.defer(() -> Flux.fromIterable(db()));  // 延迟求值
```

### `just` vs `defer` 的关键区别

```java
// just：创建时就求值了，后面 subscribe 多少次都是同一个值
Mono<Long> m1 = Mono.just(System.currentTimeMillis());

// defer：每次 subscribe 才重新求值
Mono<Long> m2 = Mono.defer(() -> Mono.just(System.currentTimeMillis()));
```

---

## 三、变换（中间操作）

### 3.1 一对一变换

```java
flux.map(s -> s.length());                // 同步 A→B
flux.cast(SubClass.class);                // 强转
flux.handle((item, sink) -> {             // 可控制跳过/报错
    if (valid(item)) sink.next(transform(item));
});
```

### 3.2 一对多变换（核心区分）

```java
// flatMap：异步并发，不保证顺序
// 10 个请求同时发出，谁先回来谁先到下游
flux.flatMap(item -> callAsyncApi(item));

// concatMap：异步串行，严格保序
// 第 1 个完成才开始第 2 个
flux.concatMap(item -> callAsyncApi(item));

// flatMapSequential：异步并发但保序输出
// 10 个同时发出，但按原始顺序推到下游
flux.flatMapSequential(item -> callAsyncApi(item));

// switchMap：新请求来就取消旧请求
// 搜索框输入场景：每敲一个字取消上一次请求
flux.switchMap(item -> callAsyncApi(item));

// flatMapMany：Mono → Flux
mono.flatMapMany(item -> Flux.fromIterable(item.getList()));
```

### 3.3 `map` 和 `flatMap` 的选择

```java
// map：回调返回普通值 → Mono 自动包回去
Mono<Integer> result = Mono.just("hello").map(s -> s.length());

// flatMap：回调返回 Mono/Flux → 需要"拍平"成一层
Mono<String> result = Mono.just("hello")
    .flatMap(s -> callAsyncApi(s));  // callAsyncApi 返回 Mono<String>

// 误用 map 会套娃：
Mono<Mono<String>> nested = Mono.just("hello")
    .map(s -> callAsyncApi(s));      // 两层 Mono，错误！
```

### 3.4 聚合

```java
flux.reduce(0, (a, b) -> a + b);               // 归约到单一值 → Mono<Integer>
flux.scan(0, (a, b) -> a + b);                 // 累计值流 → Flux<Integer>
flux.collectList();                             // → Mono<List<T>>
flux.collectMap(Item::getId);                   // → Mono<Map<K,T>>
flux.collectSortedList(Comparator.naturalOrder());
flux.count();                                   // → Mono<Long>
```

---

## 四、过滤

```java
flux.filter(predicate);                    // 条件过滤
flux.filterWhen(predicateAsync);           // 异步条件过滤
flux.take(5);                              // 只取前 5 个
flux.takeLast(5);                          // 只取最后 5 个
flux.takeWhile(predicate);                 // 满足就取，不满足就停
flux.takeUntil(predicate);                 // 满足就停（不取匹配的那个）
flux.skip(5);                              // 跳过前 5 个
flux.skipLast(5);                          // 跳过后 5 个
flux.distinct();                           // 去重
flux.distinctUntilChanged();               // 连续重复去重
flux.single();                             // 期望只有 1 个，多了/少了报错
flux.elementAt(3);                         // 取第 4 个 → Mono
flux.firstWithValue(a, b, c);              // 谁先发出非空值就用谁
```

---

## 五、组合

### 5.1 并行组合

```java
// zip：等所有都完成，一起打包返回
Mono.zip(a, b);              // → Mono<Tuple2>
Mono.zip(a, b, c);           // → Mono<Tuple3>
Flux.zip(f1, f2, (x,y) -> x + y);  // 一一配对

// 读取结果：
Tuple2<Msg, Msg> tuple = Mono.zip(call1, call2).block();
Msg r1 = tuple.getT1();
Msg r2 = tuple.getT2();
```

### 5.2 顺序合并

```java
// concat：严格排队，前一个完成才到下一个
Flux.concat(a, b, c);
Flux.concatDelayError(a, b, c);  // 异常先记着，全执行完再报
```

### 5.3 无序合并

```java
// merge：谁先到谁先推，不保序
Flux.merge(a, b, c);

// merge + collectList → 收集成 List
List<Msg> results = Flux.merge(call1, call2).collectList().block();
```

### 5.4 其他

```java
Flux.combineLatest(a, b, (x,y) -> x + y);  // 任意更新就用两方最新值组合
Mono.when(a, b, c);                          // 都完成才完成，不关心值
Mono.firstWithSignal(a, b);                  // 谁先完成用谁（包括空）
Mono.firstWithValue(a, b);                   // 谁先发出值用谁（忽略空）
```

---

## 六、错误处理

```java
// 替换 / 兜底
flux.onErrorReturn(defaultValue);         // 出错了返回默认值
flux.onErrorResume(e -> fallback());      // 出错了走兜底流
flux.onErrorComplete();                   // 出错了直接正常结束

// 重试
flux.retry();                              // 无限重试
flux.retry(3);                             // 重试 3 次
flux.retryWhen(errors -> errors
    .delayElements(Duration.ofSeconds(1))  // 间隔 1s 重试
    .take(5)                               // 最多 5 次
);

// 超时
flux.timeout(Duration.ofSeconds(10));                           // 超时抛异常
flux.timeout(Duration.ofSeconds(10), fallback);                 // 超时走兜底
flux.timeout(Duration.ofSeconds(10), Mono.error(new TimeoutExc()));

// 调试副作用
flux.doOnError(e -> log.error("错了", e));    // 窥探错误，不影响流
flux.doFinally(signalType -> cleanUp());       // 无论成功/失败/取消都执行
// signalType 可取：ON_COMPLETE / ON_ERROR / CANCEL
```

---

## 七、订阅（启动执行）

**不调 subscribe / block，什么都不会发生。**

```java
// 同步阻塞
String value = mono.block();                  // 一直等到返回
String value = mono.block(Duration.ofSeconds(10));  // 带超时

// 异步回调
mono.subscribe(
    value -> log.info("结果: {}", value),      // onNext
    error -> log.error("出错", error),          // onError
    ()    -> log.info("完成")                   // onComplete
);

// 副作用偷看（不终止流）
mono.doOnNext(v -> log.debug("偷看: {}", v))
    .doOnError(e -> log.error("炸了", e))
    .blockLast();
```

---

## 八、时间相关

```java
// 延迟
Mono.delay(Duration.ofSeconds(1));                     // 1s 后发一个 0
Mono.just("x").delayElement(Duration.ofSeconds(1));    // 1s 后才发出
Mono.just("x").delaySubscription(Duration.ofSeconds(1)); // 1s 后才开始

// 定时
Flux.interval(Duration.ofSeconds(1));                  // 每秒发一个递增 Long
Flux.interval(Duration.ofMillis(100), Duration.ofSeconds(1));  // 初始延迟100ms

// 采样 / 去抖
flux.sample(Duration.ofSeconds(1));                    // 每秒采样最新值
flux.sampleFirst(Duration.ofSeconds(1));                // 每秒取第一个值
flux.debounce(Duration.ofMillis(300));                  // 300ms 无新数据才发出
```

---

## 九、线程模型（Schedulers）

### 内置调度器

```java
Schedulers.immediate()       // 当前线程
Schedulers.single()          // 单一可复用线程
Schedulers.parallel()        // 固定线程池 = CPU 核数，适合 CPU 密集
Schedulers.boundedElastic()  // 弹性线程池，上限约 10×CPU 核数，适合 IO 密集
Schedulers.fromExecutor()    // 自定义线程池
```

### subscribeOn vs publishOn

```java
// subscribeOn：指定数据源产生在哪个线程 ← 靠近源头
.publishOn(Schedulers.boundedElastic());  // ← 上游切到 IO 线程

// publishOn：指定后续操作在哪个线程 ← 可多次使用
.publishOn(Schedulers.parallel())         // ← 下游切到 CPU 线程

// 典型组合：
mono.subscribeOn(Schedulers.boundedElastic())  // 网络请求用 IO 线程
    .publishOn(Schedulers.parallel())           // 后续计算用 CPU 线程
    .map(this::heavyCompute)
    .subscribe();
```

> **规则：`subscribeOn` 只看最靠近源头的那个，`publishOn` 哪里写哪里生效。**

---

## 十、背压（Backpressure）

当生产者速度快于消费者时：

```java
// 缓冲策略
flux.onBackpressureBuffer(100);       // 缓冲 100 条，超了报错
flux.onBackpressureBuffer(100,        // 满了时丢弃最老的
    dropped -> log.warn("丢弃: {}", dropped));

// 丢弃策略
flux.onBackpressureDrop();            // 满了就丢弃
flux.onBackpressureDrop(dropped -> log.warn("丢弃: {}", dropped));

flux.onBackpressureLatest();          // 满了只保留最新一条
flux.onBackpressureError();           // 满了直接报错

// 消费者控制速率
flux.limitRate(50);                   // 每次请求 50 条，处理完再要
flux.limitRequest(1);                 // 每次只请求 1 条
```

---

## 十一、热流 vs 冷流

### 冷流（默认）

每次 `subscribe` 都重新执行，独立完整：

```java
Flux<Integer> cold = Flux.range(1, 5);
cold.subscribe(v -> println("A: " + v));  // A: 1,2,3,4,5
cold.subscribe(v -> println("B: " + v));  // B: 1,2,3,4,5   ← 重新来一遍
```

### 热流

数据独立于订阅者，订阅时只能收到之后的数据：

```java
Sinks.Many<String> sink = Sinks.many()
    .multicast()                   // 多播策略
    .onBackpressureBuffer();
Flux<String> hot = sink.asFlux();

sink.tryEmitNext("事件1");         // 还没人订阅，丢了
hot.subscribe(v -> println(v));    // 开始订阅
sink.tryEmitNext("事件2");         // → 收到
sink.tryEmitNext("事件3");         // → 收到
```

三种策略：

```java
Sinks.many().multicast();   // 多播：多订阅者互不影响
Sinks.many().unicast();     // 单播：只能一个订阅者
Sinks.many().replay();      // 重播：新订阅者能收到历史数据
```

---

## 十二、条件分支

```java
// filter + switchIfEmpty = if-else
mono.filter(val -> val > 0)
    .switchIfEmpty(Mono.just(defaultValue));

// delayUntil：结果不变，但等一个异步操作完成才继续
mono.delayUntil(result -> saveToDb(result));

// then：忽略前值，开始新事
mono.then(Mono.just("下一步"));

// defaultIfEmpty：和 switchIfEmpty 区别
Mono.empty().defaultIfEmpty("默认值");   // 立即给默认值
Mono.empty().switchIfEmpty(monoFromDb());// 走兜底异步逻辑
```

---

## 十三、资源管理

```java
// using：try-with-resources 的 Reactor 版本
Mono.using(
    () -> openConnection(),       // 获取资源
    conn -> useConnection(conn),  // 使用资源 → Mono<T>
    conn -> conn.close()          // 清理资源
);
```

---

## 十四、调试

```java
flux.log();                              // 打印所有信号
flux.log("标签名");                       // 带标签
flux.doOnNext(v -> log.debug("{}", v));  // 只打印 onNext
flux.checkpoint("标记点");                // 出错时堆栈里显示这个标记
```

---

## 十五、测试（StepVerifier）

```java
// 基础验证
StepVerifier.create(flux)
    .expectNext("a")
    .expectNext("b")
    .expectNextCount(3)
    .expectComplete()
    .verify();

// 验证异常
StepVerifier.create(errorFlux)
    .expectError(TimeoutException.class)
    .verify();

// 匹配断言
StepVerifier.create(mono)
    .expectNextMatches(v -> v.length() > 3)
    .verifyComplete();

// 虚拟时间（时间加速，不用真等）
StepVerifier.withVirtualTime(() -> 
        Flux.interval(Duration.ofHours(1)).take(3))
    .thenAwait(Duration.ofHours(3))
    .expectNext(0L, 1L, 2L)
    .verifyComplete();
```

---

## 十六、速查表

| 想做的事 | 用这个 |
|---|---|
| A 做完做 B | `flatMap` / `concatMap` |
| A 和 B 同时做 | `zip` |
| 列表逐个异步处理 | `Flux.fromIterable(list).flatMap(item → ...)` |
| 谁先到先用谁 | `merge` / `firstWithValue` |
| 定时任务 | `Flux.interval()` |
| 超时处理 | `.timeout()` |
| 出错兜底 | `.onErrorResume()` |
| 出错重试 | `.retry()` / `.retryWhen()` |
| 转同步 | `.block()` / `.blockFirst()` / `.blockLast()` |
| 调异步方法 | `flatMap`（回调返回 Mono/Flux） |
| 同步转换 | `map`（回调返回普通值） |
| 调试 | `.log()` / `.checkpoint()` |
| 测试 | `StepVerifier` |

---

## 十七、AgentScope 并发模型理解

Agent 是无状态引擎，同一实例天然支持并发请求：

```java
// 不同用户 —— 完全并行
Mono<Msg> aliceCall = agent.call(aliceMsg, 
    RuntimeContext.builder().userId("alice").sessionId("s1").build());
Mono<Msg> bobCall = agent.call(bobMsg, 
    RuntimeContext.builder().userId("bob").sessionId("s2").build());
Mono.zip(aliceCall, bobCall).block();  // 并行执行

// 同一用户同一 session —— 自动串行，保证历史一致
Mono<Msg> call1 = agent.call(msg1, 
    RuntimeContext.builder().userId("alice").sessionId("s1").build());
Mono<Msg> call2 = agent.call(msg2, 
    RuntimeContext.builder().userId("alice").sessionId("s1").build());
// call2 排在 call1 后面执行
```

**原理：状态（对话历史）外挂在 RuntimeContext 里，引擎本身不存状态，所以不同 session 天然互不干扰。**
