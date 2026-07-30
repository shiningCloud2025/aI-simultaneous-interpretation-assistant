package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.UserStatusEnum;
import com.lucky.server.common.jwt.JwtUtil;
import com.lucky.server.common.util.WebUtil;
import com.lucky.server.domain.dto.SysUserLoginDTO;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.SysUserLoginTokenVO;
import com.lucky.server.mapper.SysUserMapper;
import com.lucky.server.service.SysUserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 系统用户 Service 实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {

    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    @Override
    public SysUserLoginTokenVO login(SysUserLoginDTO dto, HttpServletRequest request) {
        // 密码登录：keyword + password 同时存在
        if (dto.keyword() != null && !dto.keyword().isBlank()
                && dto.password() != null && !dto.password().isBlank()) {
            return loginByPassword(dto, request);
        }

        // 验证码登录
        if (dto.captcha() != null && !dto.captcha().isBlank()) {
            if (dto.phone() != null && !dto.phone().isBlank()) {
                return loginByPhone(dto, request);
            }
            if (dto.email() != null && !dto.email().isBlank()) {
                return loginByEmail(dto, request);
            }
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "手机号或邮箱不能为空");
        }

        throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "请填写完整的登录信息");

    }


    /**
     * 密码登录
     */
    private SysUserLoginTokenVO loginByPassword(SysUserLoginDTO dto, HttpServletRequest request){
        String keyword = dto.keyword();

        SysUser user = lambdaQuery()
                .and(w -> w.eq(SysUser::getAccount, keyword)
                        .or().eq(SysUser::getPhone, keyword)
                        .or().eq(SysUser::getEmail, keyword))
                .one();

        if (user == null || !passwordEncoder.matches(dto.password(), user.getPassword())) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "账号或密码错误");
        }

        if (user.getStatus() == UserStatusEnum.DISABLED) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "账号已被禁用");
        }

        // 更新登录信息
        lambdaUpdate().eq(SysUser::getId,user.getId())
                .set(SysUser::getLastLoginTime,LocalDateTime.now())
                .set(SysUser::getLastLoginIp, WebUtil.getClientIp(request))
                .update();

        // 生成 Token
        String token = jwtUtil.generateToken(user.getId(), user.getAccount(), user.getUsername());
        return new SysUserLoginTokenVO(token);
    }


    /**
     * 手机号+验证码登录
     */
    private SysUserLoginTokenVO loginByPhone(SysUserLoginDTO dto, HttpServletRequest request) {
        // TODO: 手机号+验证码登录
        throw new BusinessException(ResultCodeEnum.UNSUPPORTED_OPERATION, "验证码登录暂未开放");
    }

    /**
     * 邮箱+验证码登录
     */
    private SysUserLoginTokenVO loginByEmail(SysUserLoginDTO dto, HttpServletRequest request) {
        // TODO: 邮箱+验证码登录
        throw new BusinessException(ResultCodeEnum.UNSUPPORTED_OPERATION, "验证码登录暂未开放");
    }
}
