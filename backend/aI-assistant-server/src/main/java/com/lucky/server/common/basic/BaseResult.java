package com.lucky.server.common.basic;

import com.lucky.server.common.enums.ResultCodeEnum;
import lombok.Data;

/**
 * 统一结果返回值
 * @author shiningCloud2025
 */
@Data
public class BaseResult<T>{
    private Integer code;
    private String message;
    private String detail;
    private T data;

    public BaseResult(int code, String message, String detail, T data) {
        this.code = code;
        this.message = message;
        this.detail = detail;
        this.data = data;
    }

    public static <T> BaseResult<T> ok() {
        return new BaseResult<>(ResultCodeEnum.SUCCESS.getCode(),
                ResultCodeEnum.SUCCESS.getMessage(), null, null);
    }

    public static <T> BaseResult<T> ok(T data) {
        return new BaseResult<>(ResultCodeEnum.SUCCESS.getCode(),
                ResultCodeEnum.SUCCESS.getMessage(), null, data);
    }

    public static <T> BaseResult<T> ok(String message, T data) {
        return new BaseResult<>(ResultCodeEnum.SUCCESS.getCode(), message, null, data);
    }
}

