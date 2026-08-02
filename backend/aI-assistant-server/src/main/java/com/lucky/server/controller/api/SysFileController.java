package com.lucky.server.controller.api;

import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.vo.SysFileVO;
import com.lucky.server.service.SysFileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("api/file")
@RequiredArgsConstructor
@Tag(name = "SysFileController", description = "文件控制器")
public class SysFileController {

    private final SysFileService sysFileService;

    @PostMapping("/upload")
    @Operation(summary = "上传文件")
    public BaseResult<SysFileVO> upload(@RequestParam("file") MultipartFile file) {
        return BaseResult.ok(sysFileService.upload(file));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除文件")
    public BaseResult<Void> delete(@PathVariable Long id) {
        sysFileService.delete(id);
        return BaseResult.ok();
    }
}