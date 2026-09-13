package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.domain.dto.SysUserSkillPageQueryDTO;
import com.lucky.server.domain.vo.SysUserSkillVO;

/**
 * 用户端 Skill 服务
 * @author shiningCloud2025
 */
public interface SysUserSkillService {

    /**
     * 分页查询用户可见 Skill。
     * 查询口径：
     * 1. 直接读取 AgentScope 原生 Skill 表
     * 2. 只支持按 Skill 名称模糊搜索
     * 3. 用户端不返回 Skill 内容、元数据和资源正文
     *
     * @param dto 查询参数
     * @return Skill分页
     */
    Page<SysUserSkillVO> pageSkills(SysUserSkillPageQueryDTO dto);
}
