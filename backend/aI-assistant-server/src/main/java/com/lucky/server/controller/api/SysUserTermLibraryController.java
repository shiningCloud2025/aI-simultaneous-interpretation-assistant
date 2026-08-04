package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.SysUserTermLibrarySaveDTO;
import com.lucky.server.domain.vo.SysUserTermLibraryVO;
import com.lucky.server.service.SysUserTermLibraryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 系统用户术语库控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/user/term/library")
@RequiredArgsConstructor
@Tag(name = "SysUserTermLibraryController", description = "系统用户术语库控制器")
public class SysUserTermLibraryController {

    private final SysUserTermLibraryService termLibraryService;

    @GetMapping
    @Operation(summary = "获取当前用户全部术语库列表")
    public BaseResult<List<SysUserTermLibraryVO>> list() {
        return BaseResult.ok(termLibraryService.listByUserId());
    }

    @PostMapping
    @Operation(summary = "创建术语库")
    public BaseResult<SysUserTermLibraryVO> create(@Valid @RequestBody SysUserTermLibrarySaveDTO dto) {
        return BaseResult.ok(termLibraryService.create(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "修改术语库")
    public BaseResult<SysUserTermLibraryVO> update(@PathVariable Long id, @Valid @RequestBody SysUserTermLibrarySaveDTO dto) {
        return BaseResult.ok(termLibraryService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除术语库")
    public BaseResult<Void> delete(@PathVariable Long id) {
        termLibraryService.delete(id);
        return BaseResult.ok();
    }
}
