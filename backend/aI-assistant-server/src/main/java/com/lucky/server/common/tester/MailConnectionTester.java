package com.lucky.server.common.tester;

import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.entity.SysUserMailAccount;
import jakarta.mail.Folder;
import jakarta.mail.Session;
import jakarta.mail.Store;
import jakarta.mail.Transport;
import org.springframework.stereotype.Component;

import java.util.Properties;

/**
 * 邮箱账号连接测试工具
 * @author shiningCloud2025
 */
@Component
public class MailConnectionTester {

    public void test(SysUserMailAccount account, String mailAuthCode) {
        testImap(account, mailAuthCode);
        testSmtp(account, mailAuthCode);
    }

    private void testImap(SysUserMailAccount account, String mailAuthCode) {
        Properties properties = new Properties();
        properties.put("mail.store.protocol", "imaps");
        properties.put("mail.imaps.host", account.getImapHost());
        properties.put("mail.imaps.port", String.valueOf(account.getImapPort()));
        properties.put("mail.imaps.ssl.enable", "true");
        properties.put("mail.imaps.ssl.trust", account.getImapHost());
        properties.put("mail.imaps.connectiontimeout", "8000");
        properties.put("mail.imaps.timeout", "8000");

        Store store = null;
        Folder inbox = null;
        try {
            Session session = Session.getInstance(properties);
            store = session.getStore("imaps");
            store.connect(account.getImapHost(), account.getImapPort(), account.getEmail(), mailAuthCode);

            inbox = store.getFolder("INBOX");
            if (inbox != null && !inbox.isOpen()) {
                inbox.open(Folder.READ_ONLY);
            }
        } catch (Exception e) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "IMAP连接失败：" + e.getMessage());
        } finally {
            closeQuietly(inbox);
            closeQuietly(store);
        }
    }

    private void testSmtp(SysUserMailAccount account, String mailAuthCode) {
        Properties properties = new Properties();
        properties.put("mail.transport.protocol", "smtp");
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.host", account.getSmtpHost());
        properties.put("mail.smtp.port", String.valueOf(account.getSmtpPort()));
        properties.put("mail.smtp.ssl.enable", "true");
        properties.put("mail.smtp.ssl.trust", account.getSmtpHost());
        properties.put("mail.smtp.connectiontimeout", "8000");
        properties.put("mail.smtp.timeout", "8000");

        Transport transport = null;
        try {
            Session session = Session.getInstance(properties);
            transport = session.getTransport("smtp");
            transport.connect(account.getSmtpHost(), account.getSmtpPort(), account.getEmail(), mailAuthCode);
        } catch (Exception e) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "SMTP连接失败：" + e.getMessage());
        } finally {
            closeQuietly(transport);
        }
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

    private void closeQuietly(Transport transport) {
        if (transport == null) {
            return;
        }
        try {
            if (transport.isConnected()) {
                transport.close();
            }
        } catch (Exception ignored) {
        }
    }
}
