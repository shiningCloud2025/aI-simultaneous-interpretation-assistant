package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.ClassroomSessionPageQueryDTO;
import com.lucky.server.domain.vo.ClassroomSessionDetailVO;
import com.lucky.server.domain.vo.ClassroomSessionListVO;
import com.lucky.server.service.ClassroomSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 学生课堂课次控制器
 *
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("student/classroom/session")
@RequiredArgsConstructor
@Tag(
        name = "StudentClassroomSessionController",
        description = "学生课堂课次"
)
public class StudentClassroomSessionController {

    private final ClassroomSessionService classroomSessionService;

    @GetMapping("/{classroomSessionId}")
    @Operation(summary = "获取课次详情")
    public BaseResult<ClassroomSessionDetailVO> detail(
            @PathVariable Long classroomSessionId
    ) {
        return BaseResult.ok(
                classroomSessionService.getClassroomSessionDetail(
                        classroomSessionId
                )
        );
    }

    @PostMapping("/{classroomId}/page")
    @Operation(summary = "分页查询课堂课次")
    public BaseResult<Page<ClassroomSessionListVO>> page(
            @PathVariable Long classroomId,
            @Valid @RequestBody ClassroomSessionPageQueryDTO dto
    ) {
        return BaseResult.ok(
                classroomSessionService.pageClassroomSessions(
                        classroomId,
                        dto
                )
        );
    }
}
