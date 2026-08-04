package com.lucky.server.common.tester;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * OpenAI兼容协议 LLM 连通性测试器
 * @author shiningCloud2025
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LlmApiKeyTester {

    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * 测试 LLM API Key 是否可用
     *
     * @param endpoint  接口地址（如 https://dashscope.aliyuncs.com/compatible-mode/v1）
     * @param apiKey    API Key
     * @param testModel 测试用模型名
     * @return true=可用, false=不可用
     */
    public boolean test(String endpoint, String apiKey, String testModel) {
        try {
            String body = String.format("{\"model\":\"%s\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"max_tokens\":5}", testModel);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint + "/chat/completions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("LLM Key 测试结果: status={}", response.statusCode());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.error("LLM Key 测试异常", e);
            return false;
        }
    }
}
