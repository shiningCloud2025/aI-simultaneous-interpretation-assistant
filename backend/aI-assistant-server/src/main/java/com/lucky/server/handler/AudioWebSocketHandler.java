package com.lucky.server.handler;

import com.lucky.server.agent.listen.TranslateAgent;
import com.lucky.server.asr.AsrFactory;
import com.lucky.server.asr.stream.AsrCallback;
import com.lucky.server.asr.stream.AsrConfig;
import com.lucky.server.asr.stream.AsrService;
import com.lucky.server.common.enums.ApiKeyTypeEnum;
import com.lucky.server.common.enums.AsrModelProviderEnum;
import com.lucky.server.config.AsrModelConfig;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.domain.vo.SysUserModelPreferenceVO;
import com.lucky.server.service.SysUserApiKeyService;
import com.lucky.server.service.SysUserModelPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import java.nio.ByteBuffer;

/**
 * 实时转译 WebSocket 处理器
 * 链路：前端音频 -> ASR 识别原文 -> 增量翻译 -> 译文推前端
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AudioWebSocketHandler extends BinaryWebSocketHandler {

    private final SysUserModelPreferenceService sysUserModelPreferenceService;
    private final SysUserApiKeyService sysUserApiKeyService;
    private final AsrModelConfig asrModelConfig;
    private final AsrFactory asrFactory;
    private final TranslateAgent translateAgent;


    /** 每个 WebSocket session 一个会话上下文 */
    private final ConcurrentHashMap<String, SessionContext> sessionMap = new ConcurrentHashMap<>();

    /**
     * 会话上下文：一个连接对应的用户、ASR、增量翻译状态
     */
    private static class SessionContext {
        Long userId;                    // 用户ID（握手时解析）
        String direction;               // 翻译方向，如 zh-en
        WebSocketSession session;       // 这个连接的 WebSocket session（推送用）
        AsrService asrService;          // 这个连接的 ASR 实例
        String lastText = "";           // 已翻译到的原文位置（算增量用）
        String pendingIncrement = null; // 翻译中攒下的最新待翻增量
        boolean translating = false;    // 是否正在翻译（串行控制）
    }


    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception{
        // 1. 从握手 attributes 拿 userId 和 direction
        Long userId = (Long) session.getAttributes().get(AuthHandshakeInterceptor.ATTR_USER_ID);
        String direction = (String) session.getAttributes().get(AuthHandshakeInterceptor.ATTR_DIRECTION);

        if (userId == null) {
            log.error("连接缺少 userId，拒绝: {}", session.getId());
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("未鉴权"));
            return;
        }

        // 2. 查 ASR 模型偏好（provider + modelName）
        List<SysUserModelPreferenceVO> preferences = sysUserModelPreferenceService.listPreferences(userId);
        SysUserModelPreferenceVO asrPreference = preferences.stream()
                .filter(p -> ApiKeyTypeEnum.ASR.equals(p.modelType()))
                .findFirst()
                .orElse(null);

        if (asrPreference == null) {
            log.error("用户 {} 未配置 ASR 模型偏好", userId);
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("请先配置 ASR 模型"));
            return;
        }
        String provider = asrPreference.provider();
        String modelName = asrPreference.modelName();

        // 3. 查 ASR API Key
        SysUserApiKey apiKeyEntity = sysUserApiKeyService.getAvailableAsrKey(userId, provider);
        if (apiKeyEntity == null) {
            log.error("用户 {} 未配置可用 ASR API Key", userId);
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("请先配置 ASR API Key"));
            return;
        }
        String apiKey = apiKeyEntity.getApiKey();

        // 4. 查 ASR 模型配置，拿 wsUrl
        AsrModelConfig.ProviderInfo providerInfo = asrModelConfig.getProviders().get(provider);
        if (providerInfo == null) {
            log.error("不支持的 ASR 厂商: {}", provider);
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("不支持的 ASR 厂商"));
            return;
        }
        String wsUrl = providerInfo.getModels().stream()
                .filter(m -> m.getName().equals(modelName))
                .findFirst()
                .map(AsrModelConfig.ModelInfo::getWsUrl)
                .orElse(null);
        if (wsUrl == null) {
            log.error("ASR 模型 {} 未配置 wsUrl", modelName);
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("ASR 模型配置缺失"));
            return;
        }

        // 5. 组装 AsrConfig 并启动 ASR
        AsrConfig asrConfig = AsrConfig.builder()
                .apiKey(apiKey)
                .model(modelName)
                .format("pcm")
                .sampleRate(16000)
                .wsUrl(wsUrl)
                .build();

        AsrService asrService = asrFactory.create(AsrModelProviderEnum.fromCode(provider));

        // 6. 初始化会话上下文
        SessionContext ctx = new SessionContext();
        ctx.userId = userId;
        ctx.direction = direction;
        ctx.session = session;
        ctx.asrService = asrService;
        sessionMap.put(session.getId(), ctx);

        // 7. 启动 ASR，注册回调（回调逻辑 4b 再写）
        asrService.start(asrConfig, buildAsrCallback(ctx));

        log.info("WebSocket 连接建立: session={}, userId={}, direction={}, asrModel={}",
                session.getId(), userId, direction, modelName);
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) throws IOException {
        SessionContext ctx = sessionMap.get(session.getId());
        if (ctx == null) {
            return;
        }
        ByteBuffer buf = message.getPayload();
        byte[] chunk = new byte[buf.remaining()];
        buf.get(chunk);
        ctx.asrService.sendAudio(chunk);   // 直送，不攒
    }


    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        SessionContext ctx = sessionMap.remove(session.getId());
        if (ctx != null && ctx.asrService != null) {
            ctx.asrService.stop();
        }
        log.info("WebSocket连接断开: {}, 状态: {}", session.getId(), status);
    }

    /**
     * 构建 ASR 结果回调：识别到原文后，推送原文 + 增量翻译
     *
     * @param ctx 会话上下文
     * @return ASR 回调
     */
    private AsrCallback buildAsrCallback(SessionContext ctx) {
        return new AsrCallback() {
            @Override
            public void onInterimResult(String text) {
                handleAsrText(ctx, text);
            }

            @Override
            public void onFinalResult(String text) {
                handleAsrText(ctx, text);
            }

            @Override
            public void onError(Exception e) {
                log.error("ASR 识别出错, session={}", ctx.session.getId(), e);
                sendToClient(ctx, "{\"type\":\"error\",\"text\":\"识别出错\"}");
            }

            @Override
            public void onComplete() {
                log.info("ASR 识别完成, session={}", ctx.session.getId());
            }
        };
    }

    /**
     * 处理 ASR 识别出的文本：推送原文 + 计算增量 + 串行合并翻译
     *
     * @param ctx  会话上下文
     * @param text ASR 最新完整文本（中间结果或最终结果）
     */
    private void handleAsrText(SessionContext ctx, String text) {
        if (text == null || text.isEmpty()) {
            return;
        }

        // 1. 推送原文给前端
        sendToClient(ctx, "{\"type\":\"source\",\"text\":\"" + escapeJson(text) + "\"}");

        // 2. 计算增量（去掉已翻译部分）
        String increment;
        if (text.length() <= ctx.lastText.length()) {
            // 文本没变长（甚至回退），没有新增内容
            return;
        }
        increment = text.substring(ctx.lastText.length());
        ctx.lastText = text;   // 更新"已翻译到哪"

        // 3. 串行 + 合并：正在翻译就把增量攒着，否则立即翻译
        if (ctx.translating) {
            // 合并：把新增量追加到待翻译的增量后面（累加，不是覆盖）
            ctx.pendingIncrement = (ctx.pendingIncrement == null ? "" : ctx.pendingIncrement) + increment;
        } else {
            startTranslate(ctx, increment);
        }
    }

    /**
     * 发起一次增量翻译，结束后检查是否有攒下的增量继续翻译
     *
     * @param ctx       会话上下文
     * @param increment 本次要翻译的增量
     */
    private void startTranslate(SessionContext ctx, String increment) {
        ctx.translating = true;

        translateAgent.translate(
                ctx.userId,
                ctx.session.getId(),       // sessionId 用 WebSocket session id，保证记忆连续
                increment,
                ctx.direction,
                token -> sendToClient(ctx, "{\"type\":\"target\",\"text\":\"" + escapeJson(token) + "\"}"),
                () -> {
                    // 翻译结束（成功或失败），置空闲并检查攒下的增量
                    ctx.translating = false;
                    if (ctx.pendingIncrement != null) {
                        String next = ctx.pendingIncrement;
                        ctx.pendingIncrement = null;
                        startTranslate(ctx, next);
                    }
                }
        );
    }

    /**
     * 发送文本消息给前端
     *
     * @param ctx 会话上下文
     * @param msg 消息内容
     */
    private void sendToClient(SessionContext ctx, String msg) {
        try {
            if (ctx.session.isOpen()) {
                synchronized (ctx.session) {
                    ctx.session.sendMessage(new org.springframework.web.socket.TextMessage(msg));
                }
            }
        } catch (IOException e) {
            log.error("推送消息失败, session={}", ctx.session.getId(), e);
        }
    }

    /**
     * 转义 JSON 字符串中的特殊字符，避免拼 JSON 时破坏格式
     *
     * @param s 原始字符串
     * @return 转义后的字符串
     */
    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }







}
