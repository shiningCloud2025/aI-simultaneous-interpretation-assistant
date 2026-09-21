package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.ClassroomSessionStudentPageQueryDTO;
import com.lucky.server.domain.vo.ClassroomSessionStudentDetailVO;
import com.lucky.server.domain.vo.ClassroomSessionStudentListVO;
import com.lucky.server.service.ClassroomSessionStudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 学生课次学生记录控制器
 *
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("student/classroom/session/student")
@RequiredArgsConstructor
@Tag(
        name = "StudentClassroomSessionStudentController",
        description = "学生课次学生记录"
)
public class StudentClassroomSessionStudentController {

    private final ClassroomSessionStudentService
            classroomSessionStudentService;

    @PostMapping("/{classroomSessionId}/check-in")
    @Operation(summary = "学生签到")
    public BaseResult<ClassroomSessionStudentDetailVO> checkIn(
            @PathVariable Long classroomSessionId
    ) {
        return BaseResult.ok(
                classroomSessionStudentService.checkIn(
                        classroomSessionId
                )
        );
    }

    @GetMapping("/{classroomSessionStudentId}")
    @Operation(summary = "获取课次学生记录详情")
    public BaseResult<ClassroomSessionStudentDetailVO> detail(
            @PathVariable Long classroomSessionStudentId
    ) {
        return BaseResult.ok(
                classroomSessionStudentService
                        .getClassroomSessionStudentDetail(
                                classroomSessionStudentId
                        )
        );
    }

    @PostMapping("/{classroomSessionId}/page")
    @Operation(summary = "分页查询课次学生记录")
    public BaseResult<Page<ClassroomSessionStudentListVO>> page(
            @PathVariable Long classroomSessionId,
            @Valid
            @RequestBody
            ClassroomSessionStudentPageQueryDTO dto
    ) {
        return BaseResult.ok(
                classroomSessionStudentService
                        .pageClassroomSessionStudents(
                                classroomSessionId,
                                dto
                        )
        );
    }
}
