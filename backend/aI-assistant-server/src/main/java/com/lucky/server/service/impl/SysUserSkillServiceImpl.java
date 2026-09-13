package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.domain.dto.SysUserSkillPageQueryDTO;
import com.lucky.server.domain.entity.AgentScopeSkill;
import com.lucky.server.domain.vo.SysUserSkillVO;
import com.lucky.server.mapper.AgentScopeSkillMapper;
import com.lucky.server.service.SysUserSkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 用户端 Skill 服务实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class SysUserSkillServiceImpl implements SysUserSkillService {

    private static final String SUPERADMIN_SOURCE = "superadmin";
    private static final String OFFICIAL_SOURCE_TEXT = "官方";
    private static final long DEFAULT_PAGE_NUM = 1L;
    private static final long DEFAULT_PAGE_SIZE = 10L;
    private static final long MAX_PAGE_SIZE = 100L;

    private final AgentScopeSkillMapper agentScopeSkillMapper;

    @Override
    public Page<SysUserSkillVO> pageSkills(SysUserSkillPageQueryDTO dto) {
        LambdaQueryWrapper<AgentScopeSkill> wrapper = new LambdaQueryWrapper<>();

        if (dto != null && StringUtils.hasText(dto.name())) {
            wrapper.like(AgentScopeSkill::getName, dto.name());
        }

        wrapper.orderByDesc(AgentScopeSkill::getUpdatedAt);

        Page<AgentScopeSkill> page = agentScopeSkillMapper.selectPage(
                new Page<>(pageNum(dto == null ? null : dto.pageNum()), pageSize(dto == null ? null : dto.pageSize())),
                wrapper
        );

        Page<SysUserSkillVO> result = new Page<>(page.getCurrent(), page.getSize(), page.getTotal());
        result.setRecords(page.getRecords().stream()
                .map(skill -> new SysUserSkillVO(
                        skill.getId(),
                        skill.getName(),
                        skill.getDescription(),
                        skill.getSource(),
                        sourceText(skill.getSource()),
                        skill.getCreatedAt(),
                        skill.getUpdatedAt()
                ))
                .toList());
        return result;
    }

    /**
     * 转换 Skill 来源展示文案，保留原始 source 方便后续扩展用户上传、系统内置等来源。
     */
    private String sourceText(String source) {
        if (SUPERADMIN_SOURCE.equals(source)) {
            return OFFICIAL_SOURCE_TEXT;
        }
        return source;
    }

    private long pageNum(Long pageNum) {
        return pageNum == null || pageNum < 1 ? DEFAULT_PAGE_NUM : pageNum;
    }

    private long pageSize(Long pageSize) {
        if (pageSize == null || pageSize < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(pageSize, MAX_PAGE_SIZE);
    }
}
