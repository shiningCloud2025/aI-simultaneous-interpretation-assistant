package com.lucky.server.service;

import com.lucky.server.domain.dto.SysUserMailAccountSaveDTO;
import com.lucky.server.domain.dto.SysUserMailAccountVerifyDTO;
import com.lucky.server.domain.vo.SysUserMailAccountVO;

import java.util.List;

/**
 * 系统用户邮箱绑定账号服务接口
 * @author shiningCloud2025
 */
public interface SysUserMailAccountService {

    /** 绑定邮箱账号 */
    void saveMailAccount(SysUserMailAccountSaveDTO dto);

    /** 查看当前用户邮箱绑定列表 */
    List<SysUserMailAccountVO> listMailAccounts();

    /** 删除邮箱绑定 */
    void deleteMailAccount(Long id);

    /** 测试邮箱连接 */
    void testMailAccount(Long id);

    /** 校验平台内访问密码 */
    void verifyAccessPassword(Long id, SysUserMailAccountVerifyDTO dto);
}
