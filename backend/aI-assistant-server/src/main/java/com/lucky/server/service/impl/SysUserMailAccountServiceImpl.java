package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.MailAccountStatusEnum;
import com.lucky.server.common.enums.MailProviderEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.tester.MailConnectionTester;
import com.lucky.server.common.util.MailAuthCodeCryptoUtil;
import com.lucky.server.domain.dto.SysUserMailAccountSaveDTO;
import com.lucky.server.domain.dto.SysUserMailAccountVerifyDTO;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.entity.SysUserMailAccount;
import com.lucky.server.domain.vo.SysUserMailAccountVO;
import com.lucky.server.mapper.SysUserMailAccountMapper;
import com.lucky.server.service.SysUserMailAccountService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 系统用户邮箱绑定账号服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SysUserMailAccountServiceImpl extends ServiceImpl<SysUserMailAccountMapper, SysUserMailAccount> implements SysUserMailAccountService {

    private final SysUserService sysUserService;
    private final MailAuthCodeCryptoUtil mailAuthCodeCryptoUtil;
    private final MailConnectionTester mailConnectionTester;

    @Override
    public void saveMailAccount(SysUserMailAccountSaveDTO dto) {
        SysUser currentUser = sysUserService.getCurrentUser();
        Long userId = currentUser.getId();
        MailProviderEnum provider = MailProviderEnum.fromCode(dto.provider());
        String email = normalizeEmail(dto.email());
        LocalDateTime now = LocalDateTime.now();

        SysUserMailAccount exist = lambdaQuery()
                .eq(SysUserMailAccount::getUserId, userId)
                .eq(SysUserMailAccount::getProvider, provider)
                .eq(SysUserMailAccount::getEmail, email)
                .eq(SysUserMailAccount::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (exist != null) {
            throw new BusinessException(ResultCodeEnum.DATA_ALREADY_EXIST, "该邮箱已绑定");
        }

        SysUserMailAccount entity = new SysUserMailAccount();
        entity.setUserId(userId);
        entity.setProvider(provider);
        entity.setEmail(email);
        entity.setDisplayName(trimToNull(dto.displayName()));
        entity.setMailAuthCode(mailAuthCodeCryptoUtil.encrypt(dto.mailAuthCode().trim()));
        entity.setAccessPassword(trimToNull(dto.accessPassword()));
        entity.setImapHost(provider.getImapHost());
        entity.setImapPort(provider.getImapPort());
        entity.setSmtpHost(provider.getSmtpHost());
        entity.setSmtpPort(provider.getSmtpPort());
        entity.setStatus(MailAccountStatusEnum.UNTESTED);
        entity.setCreatedById(userId);
        entity.setCreateTime(now);
        entity.setUpdatedById(userId);
        entity.setUpdateTime(now);
        entity.setDeleted(DeletedStatusEnum.NORMAL);
        save(entity);
    }

    @Override
    public List<SysUserMailAccountVO> listMailAccounts() {
        Long userId = sysUserService.getCurrentUser().getId();
        return lambdaQuery()
                .eq(SysUserMailAccount::getUserId, userId)
                .eq(SysUserMailAccount::getDeleted, DeletedStatusEnum.NORMAL)
                .orderByDesc(SysUserMailAccount::getCreateTime)
                .list()
                .stream()
                .map(SysUserMailAccountVO::from)
                .toList();
    }

    @Override
    public void deleteMailAccount(Long id) {
        Long userId = sysUserService.getCurrentUser().getId();
        SysUserMailAccount entity = getOwnedAccount(id, userId);
        LocalDateTime now = LocalDateTime.now();

        lambdaUpdate().eq(SysUserMailAccount::getId, entity.getId())
                .eq(SysUserMailAccount::getUserId, userId)
                .set(SysUserMailAccount::getDeleted, DeletedStatusEnum.DELETED)
                .set(SysUserMailAccount::getUpdatedById, userId)
                .set(SysUserMailAccount::getUpdateTime, now)
                .update();
    }

    @Override
    public void testMailAccount(Long id) {
        Long userId = sysUserService.getCurrentUser().getId();
        SysUserMailAccount entity = getOwnedAccount(id, userId);
        if (entity.getStatus() == MailAccountStatusEnum.DISABLED) {
            throw new BusinessException(ResultCodeEnum.ILLEGAL_STATE, "邮箱绑定已被禁用");
        }

        LocalDateTime now = LocalDateTime.now();
        try {
            String mailAuthCode = mailAuthCodeCryptoUtil.decrypt(entity.getMailAuthCode());
            mailConnectionTester.test(entity, mailAuthCode);

            lambdaUpdate().eq(SysUserMailAccount::getId, entity.getId())
                    .eq(SysUserMailAccount::getUserId, userId)
                    .set(SysUserMailAccount::getStatus, MailAccountStatusEnum.AVAILABLE)
                    .set(SysUserMailAccount::getLastTestTime, now)
                    .set(SysUserMailAccount::getLastError, null)
                    .set(SysUserMailAccount::getUpdatedById, userId)
                    .set(SysUserMailAccount::getUpdateTime, now)
                    .update();
        } catch (BusinessException e) {
            lambdaUpdate().eq(SysUserMailAccount::getId, entity.getId())
                    .eq(SysUserMailAccount::getUserId, userId)
                    .set(SysUserMailAccount::getStatus, MailAccountStatusEnum.UNAVAILABLE)
                    .set(SysUserMailAccount::getLastTestTime, now)
                    .set(SysUserMailAccount::getLastError, e.getDetail())
                    .set(SysUserMailAccount::getUpdatedById, userId)
                    .set(SysUserMailAccount::getUpdateTime, now)
                    .update();
            throw e;
        }
    }

    @Override
    public void verifyAccessPassword(Long id, SysUserMailAccountVerifyDTO dto) {
        Long userId = sysUserService.getCurrentUser().getId();
        SysUserMailAccount entity = getOwnedAccount(id, userId);
        if (entity.getStatus() == MailAccountStatusEnum.DISABLED) {
            throw new BusinessException(ResultCodeEnum.ILLEGAL_STATE, "邮箱绑定已被禁用");
        }
        if (!StringUtils.hasText(entity.getAccessPassword())) {
            return;
        }

        String inputPassword = dto == null ? null : dto.accessPassword();
        if (!entity.getAccessPassword().equals(inputPassword)) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "邮箱访问密码错误");
        }
    }

    private SysUserMailAccount getOwnedAccount(Long id, Long userId) {
        SysUserMailAccount entity = lambdaQuery()
                .eq(SysUserMailAccount::getId, id)
                .eq(SysUserMailAccount::getUserId, userId)
                .eq(SysUserMailAccount::getDeleted, DeletedStatusEnum.NORMAL)
                .one();
        if (entity == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "邮箱绑定不存在");
        }
        return entity;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
