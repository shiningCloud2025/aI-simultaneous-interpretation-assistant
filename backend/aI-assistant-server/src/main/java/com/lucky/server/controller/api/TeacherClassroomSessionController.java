package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.ClassroomSessionPageQueryDTO;
import com.lucky.server.domain.dto.ClassroomSessionStartDTO;
import com.lucky.server.domain.vo.ClassroomSessionDetailVO;
import com.lucky.server.domain.vo.ClassroomSessionListVO;
import com.lucky.server.service.ClassroomSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 老师课堂课次控制器
 *
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("teacher/classroom/session")
@RequiredArgsConstructor
@Tag(
        name = "TeacherClassroomSessionController",
        description = "老师课堂课次管理"
)
public class TeacherClassroomSessionController {

    private final ClassroomSessionService classroomSessionService;

    @PostMapping("/{classroomId}")
    @Operation(summary = "开始一个新课次")
    public BaseResult<ClassroomSessionDetailVO> start(
            @PathVariable Long classroomId,
            @Valid @RequestBody ClassroomSessionStartDTO dto
    ) {
        return BaseResult.ok(
                classroomSessionService.startClassroomSession(
                        classroomId,
                        dto
                )
        );
    }

    @PostMapping("/{classroomSessionId}/pause")
    @Operation(summary = "暂停课次")
    public BaseResult<ClassroomSessionDetailVO> pause(
            @PathVariable Long classroomSessionId
    ) {
        return BaseResult.ok(
                classroomSessionService.pauseClassroomSession(
                        classroomSessionId
                )
        );
    }

    @PostMapping("/{classroomSessionId}/resume")
    @Operation(summary = "继续课次")
    public BaseResult<ClassroomSessionDetailVO> resume(
            @PathVariable Long classroomSessionId
    ) {
        return BaseResult.ok(
                classroomSessionService.resumeClassroomSession(
                        classroomSessionId
                )
        );
    }

    @PostMapping("/{classroomSessionId}/end")
    @Operation(summary = "结束课次")
    public BaseResult<ClassroomSessionDetailVO> end(
            @PathVariable Long classroomSessionId
    ) {
        return BaseResult.ok(
                classroomSessionService.endClassroomSession(
                        classroomSessionId
                )
        );
    }

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
