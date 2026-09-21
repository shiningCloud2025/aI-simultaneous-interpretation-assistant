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
 * 老师课次学生记录控制器
 *
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("teacher/classroom/session/student")
@RequiredArgsConstructor
@Tag(
        name = "TeacherClassroomSessionStudentController",
        description = "老师课次学生记录管理"
)
public class TeacherClassroomSessionStudentController {

    private final ClassroomSessionStudentService
            classroomSessionStudentService;

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
