package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.ClassroomJoinDTO;
import com.lucky.server.domain.dto.StudentClassroomPageQueryDTO;
import com.lucky.server.domain.vo.ClassroomDetailVO;
import com.lucky.server.domain.vo.StudentClassroomDetailVO;
import com.lucky.server.domain.vo.StudentClassroomListVO;
import com.lucky.server.service.ClassroomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 学生课堂控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("student/classroom")
@RequiredArgsConstructor
@Tag(name = "StudentClassroomController", description = "学生课堂")
public class StudentClassroomController {

    private final ClassroomService classroomService;

    @PostMapping("/join")
    @Operation(summary = "使用邀请码加入课堂")
    public BaseResult<ClassroomDetailVO> join(
            @Valid @RequestBody ClassroomJoinDTO dto
    ) {
        return BaseResult.ok(classroomService.joinClassroom(dto));
    }

    @PostMapping("/page")
    @Operation(summary = "分页查询我加入的课堂")
    public BaseResult<Page<StudentClassroomListVO>> page(
            @Valid @RequestBody StudentClassroomPageQueryDTO dto
    ) {
        return BaseResult.ok(classroomService.pageMyJoinedClassrooms(dto));
    }

    @GetMapping("/{classroomId}")
    @Operation(summary = "获取我加入的课堂详情")
    public BaseResult<StudentClassroomDetailVO> detail(
            @PathVariable Long classroomId
    ) {
        return BaseResult.ok(
                classroomService.getMyJoinedClassroomDetail(classroomId)
        );
    }
}
