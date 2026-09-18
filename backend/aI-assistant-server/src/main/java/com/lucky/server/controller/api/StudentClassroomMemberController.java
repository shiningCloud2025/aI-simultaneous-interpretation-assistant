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
 * 学生课堂成员控制器
 * @author shiningCloud2025
 */
@RestController
@RequestMapping("student/classroom/member")
@RequiredArgsConstructor
@Tag(name = "StudentClassroomMemberController", description = "学生课堂成员")
public class StudentClassroomMemberController {

    private final ClassroomMemberService classroomMemberService;

    @PutMapping("/{classroomMemberId}")
    @Operation(summary = "修改自己的课堂真实姓名")
    public BaseResult<ClassroomMemberDetailVO> update(
            @PathVariable Long classroomMemberId,
            @Valid @RequestBody ClassroomMemberUpdateDTO dto
    ) {
        return BaseResult.ok(
                classroomMemberService.updateMyClassroomMember(classroomMemberId, dto)
        );
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
