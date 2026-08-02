package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.UserStatusEnum;
import com.lucky.server.common.jwt.JwtUserInfo;
import com.lucky.server.common.jwt.JwtUtil;
import com.lucky.server.common.util.WebUtil;
import com.lucky.server.domain.dto.SysUserLoginDTO;
import com.lucky.server.domain.dto.SysUserRegisterDTO;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.SysUserLoginTokenVO;
import com.lucky.server.mapper.SysUserMapper;
import com.lucky.server.service.SysUserService;
import com.lucky.server.service.SysUserSmsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final SysUserSmsService sysUserSmsService;
    private final SysUserEmailServiceImpl sysUserEmailService;
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

    @Override
    public SysUserLoginTokenVO register(SysUserRegisterDTO dto, HttpServletRequest request) {
        // 1. 校验 account 唯一性
        if (lambdaQuery().eq(SysUser::getAccount, dto.account()).one() != null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "账号已存在");
        }

        // 2. 填了手机号 → 校验短信验证码 + 唯一性
        if (dto.phone() != null && !dto.phone().isBlank()) {
            if (dto.smsCaptcha() == null || dto.smsCaptcha().isBlank()) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "请填写短信验证码");
            }
            sysUserSmsService.checkCode(dto.phone(), dto.smsCaptcha());
            if (lambdaQuery().eq(SysUser::getPhone, dto.phone()).one() != null) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "手机号已被注册");
            }
        }

        // 3. 填了邮箱 → 校验邮箱验证码 + 唯一性
        if (dto.email() != null && !dto.email().isBlank()) {
            if (dto.emailCaptcha() == null || dto.emailCaptcha().isBlank()) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "请填写邮箱验证码");
            }
            sysUserEmailService.checkCode(dto.email(), dto.emailCaptcha());
            if (lambdaQuery().eq(SysUser::getEmail, dto.email()).one() != null) {
                throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "邮箱已被注册");
            }
        }

        // 4. 构建用户实体
        SysUser user = new SysUser();
        user.setAccount(dto.account());
        user.setUsername(dto.username());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setPhone(dto.phone());
        user.setEmail(dto.email());
        user.setAvatar("https://gd-hbimg.huaban.com/248453c441723291d2fe2cd622181fcd3de7a56817ba-G1KfqQ_fw658");
        user.setStatus(UserStatusEnum.ENABLED);
        user.setLastLoginTime(LocalDateTime.now());
        user.setLastLoginIp(WebUtil.getClientIp(request));
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());

        // 5. 入库
        save(user);

        // 6. 生成 Token
        String token = jwtUtil.generateToken(user.getId(), user.getAccount(), user.getUsername());

        // 7. Token 生成成功，删除验证码
        if (dto.phone() != null && !dto.phone().isBlank()) {
            sysUserSmsService.deleteCode(dto.phone());
        }
        if (dto.email() != null && !dto.email().isBlank()) {
            sysUserEmailService.deleteCode(dto.email());
        }

        return new SysUserLoginTokenVO(token);
    }

    @Override
    public SysUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        JwtUserInfo userInfo = (JwtUserInfo) auth.getDetails();
        SysUser user = lambdaQuery().eq(SysUser::getId, userInfo.getUserId()).one();
        if (user == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "用户不存在");
        }
        return user;
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
     * 生成随机账号（5-12位数字）
     * <p>辅助理解：
     * <pre>
     *   timestamp(8位取模) + randomNum(2位补零) → 10位
     *   超出截后12位，不足补零到5位
     * </pre>
     *
     * @return 不重复的随机账号
     */
    @Override
    public String generateRandomAccount() {
        String account;
        int maxRetries = 10;

        for (int retry = 0; retry < maxRetries; retry++) {
            long timestamp = System.currentTimeMillis() % 100000000L;
            int randomNum = (int) (Math.random() * 100);
            account = String.format("%d%02d", timestamp, randomNum);

            if (account.length() > 12) {
                account = account.substring(account.length() - 12);
            } else if (account.length() < 5) {
                account = String.format("%05d", Long.parseLong(account));
            }

            if (lambdaQuery().eq(SysUser::getAccount, account).one() == null) {
                return account;
            }
        }

        throw new BusinessException(ResultCodeEnum.SYSTEM_ERROR, "生成账号失败，请重试");
    }



    /**
     * 手机号+验证码登录
     */
    private SysUserLoginTokenVO loginByPhone(SysUserLoginDTO dto, HttpServletRequest request) {
        String phone = dto.phone();

        // 1. 校验验证码（只校验，不删除）
        sysUserSmsService.checkCode(phone, dto.captcha());

        // 2. 查用户
        SysUser user = lambdaQuery().eq(SysUser::getPhone, phone).one();
        if (user == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "手机号未注册");
        }

        // 3. 检查状态
        if (user.getStatus() == UserStatusEnum.DISABLED) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "账号已被禁用");
        }

        // 4. 更新登录信息
        lambdaUpdate().eq(SysUser::getId, user.getId())
                .set(SysUser::getLastLoginTime, LocalDateTime.now())
                .set(SysUser::getLastLoginIp, WebUtil.getClientIp(request))
                .update();

        // 5. 生成 Token
        String token = jwtUtil.generateToken(user.getId(), user.getAccount(), user.getUsername());

        // 6. Token 生成成功，登录成功，删除验证码
        sysUserSmsService.deleteCode(phone);

        return new SysUserLoginTokenVO(token);
    }

    /**
     * 邮箱+验证码登录
     */
    private SysUserLoginTokenVO loginByEmail(SysUserLoginDTO dto, HttpServletRequest request) {
        String email = dto.email();

        // 1. 校验验证码（只校验，不删除）
        sysUserEmailService.checkCode(email, dto.captcha());

        // 2. 查用户
        SysUser user = lambdaQuery().eq(SysUser::getEmail, email).one();
        if (user == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "邮箱未注册");
        }

        // 3. 检查状态
        if (user.getStatus() == UserStatusEnum.DISABLED) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "账号已被禁用");
        }

        // 4. 更新登录信息
        lambdaUpdate().eq(SysUser::getId, user.getId())
                .set(SysUser::getLastLoginTime, LocalDateTime.now())
                .set(SysUser::getLastLoginIp, WebUtil.getClientIp(request))
                .update();

        // 5. 生成 Token
        String token = jwtUtil.generateToken(user.getId(), user.getAccount(), user.getUsername());

        // 6. Token 生成成功，登录成功，删除验证码
        sysUserEmailService.deleteCode(email);

        return new SysUserLoginTokenVO(token);
    }
}
