package com.lucky.server.common.basic;

import com.lucky.server.common.enums.ResultCodeEnum;
import lombok.Getter;
/**
 * 业务异常
 * @author shiningCloud2025
 */
@Getter
public class BusinessException extends RuntimeException{
    private final Integer code;
    private final String detail;

    public BusinessException(ResultCodeEnum resultCodeEnum) {
        super(resultCodeEnum.getMessage());
        this.code = resultCodeEnum.getCode();
        this.detail = null;
    }

    public BusinessException(ResultCodeEnum resultCodeEnum, String detail) {
        super(resultCodeEnum.getMessage());
        this.code = resultCodeEnum.getCode();
        this.detail = detail;
    }

    // 扩展：不传 ResultCode，自定义 code
    public BusinessException(int code, String message, String detail) {
        super(message);
        this.code = code;
        this.detail = detail;
    }
}
