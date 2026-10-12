package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.AnnouncementPageQueryDTO;
import com.lucky.server.domain.vo.AnnouncementDetailVO;
import com.lucky.server.domain.vo.AnnouncementListVO;
import com.lucky.server.service.SysUserAnnouncementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 系统用户公告控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("sys/user/announcement")
@RequiredArgsConstructor
@Tag(name = "SysUserAnnouncementController", description = "系统用户公告控制器")
public class SysUserAnnouncementController {

    private final SysUserAnnouncementService sysUserAnnouncementService;

    @GetMapping("/latest-unread")
    @Operation(summary = "查询最新未读公告")
    public BaseResult<AnnouncementDetailVO> latestUnread() {
        return BaseResult.ok(sysUserAnnouncementService.latestUnread());
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "标记公告已读")
    public BaseResult<Void> read(@PathVariable Long id) {
        sysUserAnnouncementService.read(id);
        return BaseResult.ok();
    }

    @PostMapping("/page")
    @Operation(summary = "分页查询公告")
    public BaseResult<Page<AnnouncementListVO>> page(@Valid @RequestBody AnnouncementPageQueryDTO dto) {
        return BaseResult.ok(sysUserAnnouncementService.pageAnnouncements(dto));
    }

    @GetMapping("/{id}")
    @Operation(summary = "查询公告详情")
    public BaseResult<AnnouncementDetailVO> detail(@PathVariable Long id) {
        return BaseResult.ok(sysUserAnnouncementService.detail(id));
    }
}
