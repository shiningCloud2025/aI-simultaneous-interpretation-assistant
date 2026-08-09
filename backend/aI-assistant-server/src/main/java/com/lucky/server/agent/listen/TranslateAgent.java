package com.lucky.server.agent.listen;

import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.entity.SysUserApiKey;
import com.lucky.server.service.SysUserApiKeyService;
import com.lucky.server.service.SysUserModelPreferenceService;
import com.lucky.server.service.SysUserService;
import io.agentscope.harness.agent.HarnessAgent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TranslateAgent {

    private final SysUserService sysUserService;
    private final SysUserApiKeyService sysUserApiKeyService;
    private final SysUserModelPreferenceService sysUserModelPreferenceService;


    /** HarnessAgent 缓存（key = userId:sessionId） */
    private final Map<String, HarnessAgent> agentCache = new ConcurrentHashMap<>();
    /**
     * 实时翻译
     * @param sessionId  会话ID（同一用户多次翻译用不同sessionId区分）
     * @param sourceText ASR识别的最新原文
     * @param onToken    译文token回调（每个token推送给前端，实现打字机效果）
     */
    public void translate(String sessionId, String sourceText, Consumer<String> onToken){

        String agentKey = sysUserService.getCurrentUser().getId() + ":" + sessionId;
        HarnessAgent agent = agentCache.computeIfAbsent(agentKey, k -> buildAgent());
    }

    /**
     * 构建 HarnessAgent
     * 根据当前用户配置（API Key、模型偏好、术语库）创建翻译 Agent
     */
    private HarnessAgent buildAgent(){
        Long userId = sysUserService.getCurrentUser().getId();

        // 1. 查 API Key
        SysUserApiKey apiKeyEntity = sysUserApiKeyService.getAvailableLlmKey();
        if (apiKeyEntity == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "请先配置可用的 LLM API Key");
        }
        String apiKey = apiKeyEntity.getApiKey();
        String provider = apiKeyEntity.getProvider();

        // 2. 查模型偏好
        // 3. 查 baseUrl
        // 4. 查术语库
        // 5. 构建模型
        // 6. 构建 system prompt
        // 7. 构建 HarnessAgent

        return null; // TODO
    }
}
