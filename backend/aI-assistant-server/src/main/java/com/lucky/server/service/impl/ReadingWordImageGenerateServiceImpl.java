package com.lucky.server.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.storage.FileStorageService;
import com.lucky.server.config.ReadingWordImageProperties;
import com.lucky.server.service.ReadingWordImageGenerateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 阅读单词图片生成服务实现
 * @author shiningCloud2025
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReadingWordImageGenerateServiceImpl implements ReadingWordImageGenerateService {

    private final ReadingWordImageProperties properties;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    private final RestClient restClient = RestClient.create();

    @Override
    public String generateAndUpload(String imagePrompt) {
        if (imagePrompt == null || imagePrompt.isBlank()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "图片生成提示词不能为空");
        }

        String temporaryImageUrl = generateTemporaryImageUrl(imagePrompt);
        byte[] imageBytes = downloadImage(temporaryImageUrl);

        String fileName = "reading-word/%s/%s.png".formatted(
                LocalDate.now(),
                UUID.randomUUID()
        );

        return fileStorageService.upload(
                fileName,
                new ByteArrayInputStream(imageBytes),
                imageBytes.length,
                "image/png"
        );
    }

    private String generateTemporaryImageUrl(String imagePrompt) {
        Map<String, Object> body = Map.of(
                "model", properties.getModel(),
                "input", Map.of(
                        "messages", List.of(
                                Map.of(
                                        "role", "user",
                                        "content", List.of(Map.of("text", imagePrompt))
                                )
                        )
                ),
                "parameters", Map.of(
                        "prompt_extend", properties.isPromptExtend(),
                        "watermark", properties.isWatermark(),
                        "n", 1,
                        "negative_prompt", "",
                        "size", properties.getSize()
                )
        );

        String response = restClient.post()
                .uri(properties.getEndpoint())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode imageNode = root.path("output")
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content")
                    .path(0)
                    .path("image");

            if (imageNode.isMissingNode() || imageNode.asText().isBlank()) {
                log.error("图片生成结果缺少 image 字段，response={}", response);
                throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "图片生成结果为空");
            }

            return imageNode.asText();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("解析图片生成结果失败，response={}", response, e);
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "解析图片生成结果失败");
        }
    }

    private byte[] downloadImage(String imageUrl) {
        try {
            return restClient.get()
                    .uri(URI.create(imageUrl))
                    .retrieve()
                    .body(byte[].class);
        } catch (Exception e) {
            log.error("下载图片生成临时文件失败，imageUrl={}", imageUrl, e);
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "下载生成图片失败");
        }
    }
}