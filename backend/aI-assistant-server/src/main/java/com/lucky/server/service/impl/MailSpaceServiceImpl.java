package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.MailAccountStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.util.MailAuthCodeCryptoUtil;
import com.lucky.server.domain.entity.SysUserMailAccount;
import com.lucky.server.domain.vo.MailFolderVO;
import com.lucky.server.mapper.SysUserMailAccountMapper;
import com.lucky.server.service.MailSpaceService;
import com.lucky.server.service.SysUserService;
import jakarta.mail.Folder;
import jakarta.mail.Session;
import jakarta.mail.Store;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Properties;

/**
 * 邮箱空间服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class MailSpaceServiceImpl implements MailSpaceService {

    private final SysUserMailAccountMapper sysUserMailAccountMapper;
    private final SysUserService sysUserService;
    private final MailAuthCodeCryptoUtil mailAuthCodeCryptoUtil;

    @Override
    public List<MailFolderVO> listFolders(Long mailAccountId) {
        SysUserMailAccount account = getCurrentUserMailAccount(mailAccountId);
        String mailAuthCode = mailAuthCodeCryptoUtil.decrypt(account.getMailAuthCode());

        Store store = null;
        try {
            Session session = Session.getInstance(buildImapProperties(account));
            store = session.getStore("imaps");
            store.connect(account.getImapHost(), account.getImapPort(), account.getEmail(), mailAuthCode);

            Folder defaultFolder = store.getDefaultFolder();
            Folder[] folders = defaultFolder.list("*");

            List<MailFolderVO> result = new ArrayList<>();
            for (Folder folder : folders) {
                result.add(toFolderVO(folder));
            }
            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "邮箱文件夹读取失败：" + e.getMessage());
        } finally {
            closeQuietly(store);
        }
    }

    private SysUserMailAccount getCurrentUserMailAccount(Long mailAccountId) {
        Long userId = sysUserService.getCurrentUser().getId();
        SysUserMailAccount account = sysUserMailAccountMapper.selectOne(new LambdaQueryWrapper<SysUserMailAccount>()
                .eq(SysUserMailAccount::getId, mailAccountId)
                .eq(SysUserMailAccount::getUserId, userId)
                .eq(SysUserMailAccount::getDeleted, DeletedStatusEnum.NORMAL));

        if (account == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "邮箱绑定不存在");
        }
        if (account.getStatus() == MailAccountStatusEnum.DISABLED) {
            throw new BusinessException(ResultCodeEnum.ILLEGAL_STATE, "邮箱绑定已被禁用");
        }
        return account;
    }

    private Properties buildImapProperties(SysUserMailAccount account) {
        Properties properties = new Properties();
        properties.put("mail.store.protocol", "imaps");
        properties.put("mail.imaps.host", account.getImapHost());
        properties.put("mail.imaps.port", String.valueOf(account.getImapPort()));
        properties.put("mail.imaps.ssl.enable", "true");
        properties.put("mail.imaps.connectiontimeout", "8000");
        properties.put("mail.imaps.timeout", "8000");
        return properties;
    }

    private MailFolderVO toFolderVO(Folder folder) {
        return new MailFolderVO(
                folder.getName(),
                folder.getFullName(),
                resolveSystemType(folder),
                safeMessageCount(folder),
                safeUnreadCount(folder)
        );
    }

    private String resolveSystemType(Folder folder) {
        String name = (folder.getFullName() == null ? folder.getName() : folder.getFullName()).toLowerCase(Locale.ROOT);
        if ("inbox".equals(name) || name.endsWith("/inbox")) {
            return "INBOX";
        }
        if (name.contains("sent") || name.contains("已发送")) {
            return "SENT";
        }
        if (name.contains("draft") || name.contains("草稿")) {
            return "DRAFTS";
        }
        if (name.contains("trash") || name.contains("deleted") || name.contains("已删除")) {
            return "TRASH";
        }
        if (name.contains("spam") || name.contains("junk") || name.contains("垃圾")) {
            return "SPAM";
        }
        if (name.contains("archive") || name.contains("存档")) {
            return "ARCHIVE";
        }
        return "CUSTOM";
    }

    private Integer safeMessageCount(Folder folder) {
        try {
            return folder.getMessageCount();
        } catch (Exception e) {
            return null;
        }
    }

    private Integer safeUnreadCount(Folder folder) {
        try {
            return folder.getUnreadMessageCount();
        } catch (Exception e) {
            return null;
        }
    }

    private void closeQuietly(Store store) {
        if (store == null) {
            return;
        }
        try {
            if (store.isConnected()) {
                store.close();
            }
        } catch (Exception ignored) {
        }
    }
}
