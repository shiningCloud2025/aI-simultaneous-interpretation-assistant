package com.lucky.server.service.impl;

import com.alibaba.dashscope.audio.ttsv2.SpeechSynthesisParam;
import com.alibaba.dashscope.audio.ttsv2.SpeechSynthesizer;
import com.alibaba.dashscope.utils.Constants;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.SpeakingTtsVoiceEnum;
import com.lucky.server.common.storage.FileStorageService;
import com.lucky.server.config.SpeakingTtsProperties;
import com.lucky.server.service.SpeakingTtsGenerateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.ByteBuffer;
import java.time.LocalDate;
import java.util.UUID;

/**
 * 口语标准音频生成服务实现
 * @author shiningCloud2025
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpeakingTtsGenerateServiceImpl implements SpeakingTtsGenerateService {

    private final SpeakingTtsProperties properties;
    private final FileStorageService fileStorageService;

    @Override
    public String generateAndUpload(String text, SpeakingTtsVoiceEnum voice, BigDecimal speechRate) {
        if (text == null || text.isBlank()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "TTS合成文本不能为空");
        }

        byte[] audioBytes = generateAudio(text.trim(), voice, speechRate);
        String fileName = "speaking-tts/%s/%s.%s".formatted(
                LocalDate.now(),
                UUID.randomUUID(),
                properties.getFileExtension()
        );

        return fileStorageService.upload(
                fileName,
                new ByteArrayInputStream(audioBytes),
                audioBytes.length,
                properties.getContentType()
        );
    }

    private byte[] generateAudio(String text, SpeakingTtsVoiceEnum voice, BigDecimal speechRate) {
        SpeechSynthesizer synthesizer = null;
        try {
            Constants.baseWebsocketApiUrl = properties.getWebsocketUrl();

            SpeechSynthesisParam param = SpeechSynthesisParam.builder()
                    .apiKey(properties.getApiKey())
                    .model(properties.getModelName())
                    .voice(voice.getCode())
                    .speechRate(speechRate.floatValue())
                    .build();

            synthesizer = new SpeechSynthesizer(param, null);
            ByteBuffer audio = synthesizer.call(text);
            if (audio == null || !audio.hasRemaining()) {
                throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "TTS音频生成结果为空");
            }

            ByteBuffer duplicate = audio.asReadOnlyBuffer();
            byte[] bytes = new byte[duplicate.remaining()];
            duplicate.get(bytes);

            log.info("[TTS] requestId={}, firstPackageDelay={}ms",
                    synthesizer.getLastRequestId(),
                    synthesizer.getFirstPackageDelay());

            return bytes;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("TTS标准音频生成失败，text={}", text, e);
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "TTS标准音频生成失败");
        } finally {
            if (synthesizer != null) {
                try {
                    synthesizer.getDuplexApi().close(1000, "bye");
                } catch (Exception e) {
                    log.warn("关闭TTS WebSocket连接失败", e);
                }
            }
        }
    }
}
