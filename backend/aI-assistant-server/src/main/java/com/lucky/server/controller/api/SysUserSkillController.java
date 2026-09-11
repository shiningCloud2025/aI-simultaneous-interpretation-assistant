package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SysUserSkillPageQueryDTO;
import com.lucky.server.domain.vo.SysUserSkillVO;
import com.lucky.server.service.SysUserSkillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户端 Skill 控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("sys/user/skills")
@RequiredArgsConstructor
@Tag(name = "SysUserSkillController", description = "用户端 Skill")
public class SysUserSkillController {

    private final SysUserSkillService sysUserSkillService;

    @GetMapping("/page")
    @Operation(summary = "分页查询用户可见 Skill")
    public BaseResult<Page<SysUserSkillVO>> pageSkills(@Valid SysUserSkillPageQueryDTO dto) {
        return BaseResult.ok(sysUserSkillService.pageSkills(dto));
    }
}
