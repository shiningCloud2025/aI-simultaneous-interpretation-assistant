package com.lucky.server.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.config.SpeakingEvaluationProperties;
import com.lucky.server.domain.dto.SpeakingEvaluationDTO;
import com.lucky.server.domain.entity.SpeakingMaterialSentence;
import com.lucky.server.domain.vo.SpeakingEvaluationResultVO;
import com.lucky.server.domain.vo.SpeakingEvaluationWordVO;
import com.lucky.server.service.SpeakingEvaluationRecordService;
import com.lucky.server.service.SpeakingEvaluationService;
import com.lucky.server.service.SpeakingMaterialSentenceService;
import com.tencent.core.ws.Credential;
import com.tencent.core.ws.SpeechClient;
import com.tencent.soe.OralEvalConstant;
import com.tencent.soe.OralEvaluationListener;
import com.tencent.soe.OralEvaluationRequest;
import com.tencent.soe.OralEvaluationResponse;
import com.tencent.soe.OralEvaluator;
import com.tencent.soe.SentenceInfo;
import com.tencent.soe.WordRsp;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 口语跟读评测服务实现
 * @author shiningCloud2025
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpeakingEvaluationServiceImpl implements SpeakingEvaluationService {

    private final SpeakingEvaluationProperties properties;
    private final SpeakingMaterialSentenceService speakingMaterialSentenceService;
    private final SpeakingEvaluationRecordService speakingEvaluationRecordService;
    private final ObjectMapper objectMapper;

    private final SpeechClient speechClient = new SpeechClient(OralEvalConstant.DEFAULT_ORAL_EVAL_REQ_URL);
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public SpeakingEvaluationResultVO evaluate(SpeakingEvaluationDTO dto) {
        if (dto == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语跟读评测请求不能为空");
        }
        if (dto.sentenceId() == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "口语素材句子ID不能为空");
        }
        if (dto.studentAudioUrl() == null || dto.studentAudioUrl().isBlank()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "学生跟读音频URL不能为空");
        }


        SpeakingMaterialSentence sentence = speakingMaterialSentenceService.getSentenceById(dto.sentenceId());
        String refText = sentence.getSentence();
        if (refText == null || refText.isBlank()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "标准跟读文本不能为空");
        }

        byte[] audioBytes = downloadAudio(dto.studentAudioUrl());
        String voiceId = UUID.randomUUID().toString();
        OralEvaluationResponse response = callTencentSoe(voiceId, refText, audioBytes);
        SentenceInfo result = response.getResult();
        if (result == null) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "口语评测结果为空");
        }

        return buildResultVO(dto.sentenceId(), voiceId, refText, dto.studentAudioUrl(), response, result);

    }


    private OralEvaluationResponse callTencentSoe(String voiceId, String refText, byte[] audioBytes) {
        Credential credential = new Credential(properties.getAppId(), properties.getSecretId(), properties.getSecretKey());
        if (properties.getToken() != null && !properties.getToken().isBlank()) {
            credential.setToken(properties.getToken());
        }

        OralEvaluationRequest request = new OralEvaluationRequest();
        request.setVoiceId(voiceId);
        request.setRefText(refText);
        request.setServerEngineType(properties.getServerEngineType());
        request.setEvalMode(properties.getEvalMode());
        request.setScoreCoeff(properties.getScoreCoeff());
        request.setVoiceFormat(properties.getVoiceFormat());
        request.setRecMode(properties.getRecMode());
        request.setSentenceInfoEnabled(properties.getSentenceInfoEnabled());
        request.setTextMode(0);

        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<OralEvaluationResponse> lastResponseRef = new AtomicReference<>();
        AtomicReference<OralEvaluationResponse> failureResponseRef = new AtomicReference<>();

        OralEvaluationListener listener = new OralEvaluationListener() {

            @Override
            public void OnIntermediateResults(OralEvaluationResponse response) {
                handleResponse(response);
            }

            @Override
            public void onRecognitionStart(OralEvaluationResponse response) {
                handleResponse(response);
            }

            @Override
            public void onRecognitionComplete(OralEvaluationResponse response) {
                handleResponse(response);
                latch.countDown();
            }

            @Override
            public void onFail(OralEvaluationResponse response) {
                failureResponseRef.set(response);
                handleResponse(response);
                latch.countDown();
            }

            @Override
            public void onMessage(OralEvaluationResponse response) {
                handleResponse(response);
            }

            private void handleResponse(OralEvaluationResponse response) {
                if (response == null) {
                    return;
                }
                if (response.getResult() != null) {
                    lastResponseRef.set(response);
                }
                if (response.getCode() != 0) {
                    failureResponseRef.set(response);
                }
            }
        };

        OralEvaluator evaluator = null;
        try {
            evaluator = new OralEvaluator(speechClient, credential, request, listener);
            evaluator.start();
            evaluator.write(audioBytes);
            evaluator.stop(properties.getTimeoutMillis());

            boolean completed = latch.await(properties.getTimeoutMillis(), TimeUnit.MILLISECONDS);
            if (!completed) {
                throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "口语评测等待超时");
            }

            OralEvaluationResponse failure = failureResponseRef.get();
            if (failure != null && failure.getCode() != 0) {
                throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "口语评测失败：" + failure.getMessage());
            }

            OralEvaluationResponse result = lastResponseRef.get();
            if (result == null) {
                throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "口语评测未返回有效结果");
            }

            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("腾讯云口语评测调用失败，voiceId={}, refText={}", voiceId, refText, e);
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "腾讯云口语评测调用失败");
        } finally {
            if (evaluator != null) {
                evaluator.close();
            }
        }
    }

    private SpeakingEvaluationResultVO buildResultVO(Long sentenceId,
                                                     String voiceId,
                                                     String refText,
                                                     String studentAudioUrl,
                                                     OralEvaluationResponse response,
                                                     SentenceInfo result) {
        List<SpeakingEvaluationWordVO> words = result.getWords() == null ? Collections.emptyList() :
                result.getWords().stream()
                        .map(this::buildWordVO)
                        .toList();
        return new SpeakingEvaluationResultVO(
                voiceId,
                sentenceId,
                refText,
                buildRecognizedText(result.getWords()),
                studentAudioUrl,
                result.getSuggestedScore(),
                result.getPronAccuracy(),
                result.getPronFluency(),
                result.getPronCompletion(),
                words,
                safeRawResponse(response)
        );
    }

    private SpeakingEvaluationWordVO buildWordVO(WordRsp word) {
        return new SpeakingEvaluationWordVO(
                word.getReferenceWord(),
                word.getWord(),
                word.getPronAccuracy(),
                word.getPronFluency(),
                Math.toIntExact(word.getMemBeginTime()),
                Math.toIntExact(word.getMemEndTime())
        );
    }

    private String buildRecognizedText(List<WordRsp> words) {
        if (words == null || words.isEmpty()) {
            return null;
        }
        return words.stream()
                .map(WordRsp::getWord)
                .filter(word -> word != null && !word.isBlank())
                .reduce((left, right) -> left + " " + right)
                .orElse(null);
    }

    private String safeRawResponse(OralEvaluationResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] downloadAudio(String studentAudioUrl) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(studentAudioUrl))
                    .timeout(Duration.ofMillis(properties.getTimeoutMillis()))
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "学生跟读音频下载失败");
            }
            if (response.body() == null || response.body().length == 0) {
                throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "学生跟读音频内容为空");
            }

            return response.body();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("下载学生跟读音频失败，studentAudioUrl={}", studentAudioUrl, e);
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "学生跟读音频下载失败");
        }
    }
}
