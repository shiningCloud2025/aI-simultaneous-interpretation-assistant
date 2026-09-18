package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.ClassroomCreateDTO;
import com.lucky.server.domain.dto.ClassroomPageQueryDTO;
import com.lucky.server.domain.dto.ClassroomUpdateDTO;
import com.lucky.server.domain.vo.ClassroomDetailVO;
import com.lucky.server.domain.vo.ClassroomInviteVO;
import com.lucky.server.domain.vo.ClassroomListVO;
import com.lucky.server.service.ClassroomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 老师课堂控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("teacher/classroom")
@RequiredArgsConstructor
@Tag(name = "TeacherClassroomController", description = "老师课堂管理")
public class TeacherClassroomController {

    private final ClassroomService classroomService;

    @PostMapping
    @Operation(summary = "创建课堂")
    public BaseResult<ClassroomDetailVO> create(
            @Valid @RequestBody ClassroomCreateDTO dto
    ) {
        return BaseResult.ok(classroomService.createClassroom(dto));
    }

    @PutMapping("/{classroomId}")
    @Operation(summary = "修改课堂基本资料")
    public BaseResult<ClassroomDetailVO> update(
            @PathVariable Long classroomId,
            @Valid @RequestBody ClassroomUpdateDTO dto
    ) {
        return BaseResult.ok(classroomService.updateClassroom(classroomId, dto));
    }

    @PostMapping("/{classroomId}/invite-code/refresh")
    @Operation(summary = "刷新课堂邀请码")
    public BaseResult<ClassroomInviteVO> refreshInviteCode(
            @PathVariable Long classroomId
    ) {
        return BaseResult.ok(classroomService.refreshInviteCode(classroomId));
    }

    @PostMapping("/{classroomId}/archive")
    @Operation(summary = "归档课堂")
    public BaseResult<Void> archive(@PathVariable Long classroomId) {
        classroomService.archiveClassroom(classroomId);
        return BaseResult.ok();
    }

    @GetMapping("/{classroomId}")
    @Operation(summary = "获取课堂详情")
    public BaseResult<ClassroomDetailVO> detail(@PathVariable Long classroomId) {
        return BaseResult.ok(classroomService.getMyClassroomDetail(classroomId));
    }

    @PostMapping("/page")
    @Operation(summary = "分页查询我的课堂")
    public BaseResult<Page<ClassroomListVO>> page(
            @Valid @RequestBody ClassroomPageQueryDTO dto
    ) {
        return BaseResult.ok(classroomService.pageMyClassrooms(dto));
    }
}
