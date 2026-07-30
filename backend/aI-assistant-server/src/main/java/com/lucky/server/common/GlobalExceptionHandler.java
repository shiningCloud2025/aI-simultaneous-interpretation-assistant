package com.lucky.server.common;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * 全局异常处理器
 * @author shiningCloud2025
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public BaseResult<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常 [{}] {} -> {}", e.getCode(), e.getMessage(), e.getDetail());
        return new BaseResult<>(e.getCode(), e.getMessage(), e.getDetail(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public BaseResult<Void> handleValidationException(MethodArgumentNotValidException e){
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ":" + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return new BaseResult<>(ResultCodeEnum.VALIDATION_ERROR.getCode()
                ,ResultCodeEnum.VALIDATION_ERROR.getMessage(),msg,null);
    }


    @ExceptionHandler(Exception.class)
    public BaseResult<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return new BaseResult<>(ResultCodeEnum.SYSTEM_ERROR.getCode(),
                ResultCodeEnum.SYSTEM_ERROR.getMessage(), null, null);

    }
}
