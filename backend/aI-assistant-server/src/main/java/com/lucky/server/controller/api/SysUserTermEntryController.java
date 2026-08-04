package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SysUserTermEntrySaveDTO;
import com.lucky.server.domain.vo.SysUserTermEntryVO;
import com.lucky.server.service.SysUserTermEntryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系统用户术语条目控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/user/term/entry")
@RequiredArgsConstructor
@Tag(name = "SysUserTermEntryController", description = "系统用户术语条目控制器")
public class SysUserTermEntryController {

    private final SysUserTermEntryService termEntryService;

    @GetMapping("/{libraryId}")
    @Operation(summary = "根据术语库ID获取全部条目")
    public BaseResult<List<SysUserTermEntryVO>> list(@PathVariable Long libraryId) {
        return BaseResult.ok(termEntryService.listByLibraryId(libraryId));
    }

    @PutMapping
    @Operation(summary = "批量保存术语条目")
    public BaseResult<Void> save(@Valid @RequestBody SysUserTermEntrySaveDTO dto) {
        termEntryService.batchSaveOrUpdate(dto.libraryId(), dto.entries());
        return BaseResult.ok();
    }
}
