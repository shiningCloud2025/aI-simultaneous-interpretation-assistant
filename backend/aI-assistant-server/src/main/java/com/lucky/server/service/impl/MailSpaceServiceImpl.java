package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.MailAccountStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.util.MailAuthCodeCryptoUtil;
import com.lucky.server.domain.dto.MailMessageDetailDTO;
import com.lucky.server.domain.dto.MailMessagePageDTO;
import com.lucky.server.domain.entity.SysUserMailAccount;
import com.lucky.server.domain.vo.MailFolderVO;
import com.lucky.server.domain.vo.MailMessageDetailVO;
import com.lucky.server.domain.vo.MailMessageSummaryVO;
import com.lucky.server.mapper.SysUserMailAccountMapper;
import com.lucky.server.service.MailSpaceService;
import com.lucky.server.service.SysUserService;
import jakarta.mail.Address;
import jakarta.mail.BodyPart;
import jakarta.mail.Flags;
import jakarta.mail.Folder;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.Store;
import jakarta.mail.UIDFolder;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeUtility;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.stream.Collectors;

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

    @Override
    public Page<MailMessageSummaryVO> pageMessages(Long mailAccountId, MailMessagePageDTO dto) {
        SysUserMailAccount account = getCurrentUserMailAccount(mailAccountId);
        String mailAuthCode = mailAuthCodeCryptoUtil.decrypt(account.getMailAuthCode());

        Store store = null;
        Folder folder = null;
        try {
            Session session = Session.getInstance(buildImapProperties(account));
            store = session.getStore("imaps");
            store.connect(account.getImapHost(), account.getImapPort(), account.getEmail(), mailAuthCode);

            folder = store.getFolder(dto.filter().folderName());
            if (folder == null || !folder.exists()) {
                throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "邮箱文件夹不存在");
            }
            folder.open(Folder.READ_ONLY);

            int total = folder.getMessageCount();
            Page<MailMessageSummaryVO> result = new Page<>(dto.page(), dto.size(), total);
            if (total <= 0) {
                result.setRecords(List.of());
                return result;
            }

            int end = total - (dto.page() - 1) * dto.size();
            if (end < 1) {
                result.setRecords(List.of());
                return result;
            }

            int start = Math.max(1, end - dto.size() + 1);
            Message[] messages = folder.getMessages(start, end);
            UIDFolder uidFolder = requireUidFolder(folder);

            List<MailMessageSummaryVO> records = new ArrayList<>();
            for (int i = messages.length - 1; i >= 0; i--) {
                records.add(toSummaryVO(messages[i], uidFolder));
            }

            result.setRecords(records);
            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "邮件列表读取失败：" + e.getMessage());
        } finally {
            closeQuietly(folder);
            closeQuietly(store);
        }
    }

    @Override
    public MailMessageDetailVO detailMessage(Long mailAccountId, MailMessageDetailDTO dto) {
        SysUserMailAccount account = getCurrentUserMailAccount(mailAccountId);
        String mailAuthCode = mailAuthCodeCryptoUtil.decrypt(account.getMailAuthCode());

        Store store = null;
        Folder folder = null;
        try {
            Session session = Session.getInstance(buildImapProperties(account));
            store = session.getStore("imaps");
            store.connect(account.getImapHost(), account.getImapPort(), account.getEmail(), mailAuthCode);

            folder = store.getFolder(dto.folderName());
            if (folder == null || !folder.exists()) {
                throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "邮箱文件夹不存在");
            }
            folder.open(Folder.READ_ONLY);

            UIDFolder uidFolder = requireUidFolder(folder);
            Message message = uidFolder.getMessageByUID(dto.uid());
            if (message == null) {
                throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "邮件不存在");
            }

            MailContent content = new MailContent();
            parsePart(message, "", content);

            return new MailMessageDetailVO(
                    uidFolder.getUID(message),
                    decodeText(message.getSubject()),
                    addressText(message.getFrom()),
                    addressList(message.getRecipients(Message.RecipientType.TO)),
                    addressList(message.getRecipients(Message.RecipientType.CC)),
                    toLocalDateTime(message.getSentDate()),
                    toLocalDateTime(message.getReceivedDate()),
                    message.isSet(Flags.Flag.SEEN),
                    content.textContent.toString(),
                    content.htmlContent.toString(),
                    content.attachments
            );
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "邮件详情读取失败：" + e.getMessage());
        } finally {
            closeQuietly(folder);
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
        properties.put("mail.imaps.ssl.trust", account.getImapHost());
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

    private MailMessageSummaryVO toSummaryVO(Message message, UIDFolder uidFolder) throws MessagingException {
        return new MailMessageSummaryVO(
                uidFolder.getUID(message),
                decodeText(message.getSubject()),
                addressText(message.getFrom()),
                toLocalDateTime(message.getSentDate()),
                toLocalDateTime(message.getReceivedDate()),
                message.isSet(Flags.Flag.SEEN),
                hasAttachment(message),
                message.getSize()
        );
    }

    private void parsePart(Part part, String partPath, MailContent content) throws Exception {
        if (part.isMimeType("text/plain") && !isAttachment(part)) {
            Object value = part.getContent();
            if (value != null) {
                content.textContent.append(value);
            }
            return;
        }

        if (part.isMimeType("text/html") && !isAttachment(part)) {
            Object value = part.getContent();
            if (value != null) {
                content.htmlContent.append(value);
            }
            return;
        }

        if (isAttachment(part)) {
            content.attachments.add(new MailMessageDetailVO.Attachment(
                    partPath,
                    decodeText(part.getFileName()),
                    part.getContentType(),
                    part.getSize()
            ));
            return;
        }

        if (part.isMimeType("multipart/*")) {
            Multipart multipart = (Multipart) part.getContent();
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart bodyPart = multipart.getBodyPart(i);
                String childPath = StringUtils.hasText(partPath) ? partPath + "." + (i + 1) : String.valueOf(i + 1);
                parsePart(bodyPart, childPath, content);
            }
            return;
        }

        if (part.isMimeType("message/rfc822")) {
            parsePart((Part) part.getContent(), partPath, content);
        }
    }

    private boolean hasAttachment(Part part) {
        try {
            if (isAttachment(part)) {
                return true;
            }
            if (part.isMimeType("multipart/*")) {
                Multipart multipart = (Multipart) part.getContent();
                for (int i = 0; i < multipart.getCount(); i++) {
                    if (hasAttachment(multipart.getBodyPart(i))) {
                        return true;
                    }
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isAttachment(Part part) throws MessagingException {
        String disposition = part.getDisposition();
        return Part.ATTACHMENT.equalsIgnoreCase(disposition)
                || Part.INLINE.equalsIgnoreCase(disposition) && StringUtils.hasText(part.getFileName())
                || StringUtils.hasText(part.getFileName());
    }

    private UIDFolder requireUidFolder(Folder folder) {
        if (folder instanceof UIDFolder uidFolder) {
            return uidFolder;
        }
        throw new BusinessException(ResultCodeEnum.UNSUPPORTED_OPERATION, "当前邮箱文件夹不支持UID查询");
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

    private String decodeText(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        try {
            return MimeUtility.decodeText(value);
        } catch (Exception e) {
            return value;
        }
    }

    private String addressText(Address[] addresses) {
        if (addresses == null || addresses.length == 0) {
            return null;
        }
        return Arrays.stream(addresses)
                .map(this::addressText)
                .collect(Collectors.joining(", "));
    }

    private List<String> addressList(Address[] addresses) {
        if (addresses == null || addresses.length == 0) {
            return List.of();
        }
        return Arrays.stream(addresses)
                .map(this::addressText)
                .toList();
    }

    private String addressText(Address address) {
        if (address instanceof InternetAddress internetAddress) {
            return internetAddress.toUnicodeString();
        }
        return address.toString();
    }

    private LocalDateTime toLocalDateTime(Date date) {
        if (date == null) {
            return null;
        }
        return LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
    }

    private void closeQuietly(Folder folder) {
        if (folder == null) {
            return;
        }
        try {
            if (folder.isOpen()) {
                folder.close(false);
            }
        } catch (Exception ignored) {
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

    private static class MailContent {
        private final StringBuilder textContent = new StringBuilder();
        private final StringBuilder htmlContent = new StringBuilder();
        private final List<MailMessageDetailVO.Attachment> attachments = new ArrayList<>();
    }
}
