package com.lucky.server.controller.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.basic.BaseResult;
import com.lucky.server.domain.dto.ClassroomMemberPageQueryDTO;
import com.lucky.server.domain.dto.ClassroomMemberUpdateDTO;
import com.lucky.server.domain.vo.ClassroomMemberDetailVO;
import com.lucky.server.domain.vo.ClassroomMemberListVO;
import com.lucky.server.service.ClassroomMemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 老师课堂成员控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("teacher/classroom/member")
@RequiredArgsConstructor
@Tag(name = "TeacherClassroomMemberController", description = "老师课堂成员管理")
public class TeacherClassroomMemberController {

    private final ClassroomMemberService classroomMemberService;

    @PutMapping("/{classroomMemberId}")
    @Operation(summary = "修改课堂成员真实姓名")
    public BaseResult<ClassroomMemberDetailVO> update(
            @PathVariable Long classroomMemberId,
            @Valid @RequestBody ClassroomMemberUpdateDTO dto
    ) {
        return BaseResult.ok(
                classroomMemberService.updateClassroomMember(classroomMemberId, dto)
        );
    }

    @DeleteMapping("/{classroomMemberId}")
    @Operation(summary = "移除课堂成员")
    public BaseResult<Void> remove(@PathVariable Long classroomMemberId) {
        classroomMemberService.removeClassroomMember(classroomMemberId);
        return BaseResult.ok();
    }

    @GetMapping("/{classroomMemberId}")
    @Operation(summary = "获取课堂成员详情")
    public BaseResult<ClassroomMemberDetailVO> detail(
            @PathVariable Long classroomMemberId
    ) {
        return BaseResult.ok(
                classroomMemberService.getClassroomMemberDetail(classroomMemberId)
        );
    }

    @PostMapping("/{classroomId}/page")
    @Operation(summary = "分页查询课堂成员")
    public BaseResult<Page<ClassroomMemberListVO>> page(
            @PathVariable Long classroomId,
            @Valid @RequestBody ClassroomMemberPageQueryDTO dto
    ) {
        return BaseResult.ok(
                classroomMemberService.pageClassroomMembers(classroomId, dto)
        );
    }
}
