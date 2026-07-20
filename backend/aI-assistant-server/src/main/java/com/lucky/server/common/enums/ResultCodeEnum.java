package com.lucky.server.common.enums;

import lombok.Getter;

/**
 * 结果编码枚举
 * @author shiningCloud2025
 */
public enum ResultCodeEnum {

    // ==================== HTTP 通用 ====================
    SUCCESS(200, "操作成功"),
    UNAUTHORIZED(401, "未登录或登录已过期"),
    FORBIDDEN(403, "无权限访问"),
    NOT_FOUND(404, "资源不存在"),
    SYSTEM_ERROR(500, "系统繁忙，请稍后再试"),


    // ==================== 业务通用 ====================
    PARAM_ERROR(10001, "参数错误"),
    VALIDATION_ERROR(10002, "数据校验失败"),       // @Valid 校验不通过
    DATA_NOT_EXIST(10003, "数据不存在"),            // 查不到某条业务数据
    DATA_ALREADY_EXIST(10004, "数据已存在"),        // 重复创建
    CONFLICT(10005, "数据冲突"),                    // 并发冲突或版本冲突
    OPERATION_FAILED(10006, "操作失败"),            // 通用操作失败
    BUSINESS_LIMIT(10007, "超出业务限制"),          // 如免费次数用完
    ILLEGAL_STATE(10008, "当前状态不允许此操作"),    // 如已完成的订单不能取消
    UNSUPPORTED_OPERATION(10009, "不支持的操作"),
    DATA_EXPIRED(10010, "数据已过期"),              // 如验证码过期
    TOO_MANY_REQUESTS(10011, "操作太频繁"),

    ;
    @Getter
    private final Integer code;
    @Getter
    private final String message;

    ResultCodeEnum(Integer code,String message){
        this.code = code;
        this.message = message;
    }
}
