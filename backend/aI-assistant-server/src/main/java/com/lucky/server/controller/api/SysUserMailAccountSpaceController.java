package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.MailMessageDetailDTO;
import com.lucky.server.domain.dto.MailMessagePageDTO;
import com.lucky.server.domain.vo.MailFolderVO;
import com.lucky.server.domain.vo.MailMessageDetailVO;
import com.lucky.server.domain.vo.MailMessageSummaryVO;
import com.lucky.server.service.MailSpaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系统用户邮箱空间控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("sys/user/mail-account/{accountId}/space")
@RequiredArgsConstructor
@Tag(name = "SysUserMailAccountSpaceController", description = "系统用户邮箱空间控制器")
public class SysUserMailAccountSpaceController {

    private final MailSpaceService mailSpaceService;

    @GetMapping("/folders")
    @Operation(summary = "查询邮箱文件夹列表")
    public BaseResult<List<MailFolderVO>> listFolders(@PathVariable Long accountId) {
        return BaseResult.ok(mailSpaceService.listFolders(accountId));
    }

    @PostMapping("/messages/page")
    @Operation(summary = "分页查询邮箱邮件列表")
    public BaseResult<Page<MailMessageSummaryVO>> pageMessages(
            @PathVariable Long accountId,
            @Valid @RequestBody MailMessagePageDTO dto
    ) {
        return BaseResult.ok(mailSpaceService.pageMessages(accountId, dto));
    }

    @PostMapping("/messages/detail")
    @Operation(summary = "查询邮箱邮件详情")
    public BaseResult<MailMessageDetailVO> detailMessage(
            @PathVariable Long accountId,
            @Valid @RequestBody MailMessageDetailDTO dto
    ) {
        return BaseResult.ok(mailSpaceService.detailMessage(accountId, dto));
    }
}
