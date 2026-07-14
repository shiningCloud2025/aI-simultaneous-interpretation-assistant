package com.lucky.server.asr;

import com.lucky.server.asr.stream.AsrService;
import com.lucky.server.asr.stream.impl.AlibabaAsrService;
import com.lucky.server.common.enums.AsrModelProviderEnum;
import org.springframework.stereotype.Component;

/**
 * ASR 工厂 — 根据厂商名创建对应实现
 * @author shiningCloud2025
 */
@Component
public class AsrFactory {
    public AsrService create(AsrModelProviderEnum provider){
        return switch (provider){
            case AsrModelProviderEnum.ALIBABA -> new AlibabaAsrService();
        };
    }
}
