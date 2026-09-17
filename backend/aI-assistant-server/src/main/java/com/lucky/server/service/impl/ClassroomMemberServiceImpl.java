package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ClassroomMemberJoinTypeEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.UserStatusEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import com.lucky.server.domain.entity.ClassroomMember;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.mapper.ClassroomMemberMapper;
import com.lucky.server.service.ClassroomMemberService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 课堂成员 Service 实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class ClassroomMemberServiceImpl extends ServiceImpl<ClassroomMemberMapper, ClassroomMember> implements ClassroomMemberService {

    private final SysUserService sysUserService;

    @Override
    public Long addClassroomMember(Long classroomId, Long studentId, String studentName,
            ClassroomMemberJoinTypeEnum joinType
    ) {
        if (classroomId == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "课堂ID不能为空");
        }

        if (studentId == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "学生用户ID不能为空");
        }

        if (studentName == null || studentName.isBlank()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "学生真实姓名不能为空");
        }

        String normalizedStudentName = studentName.trim();

        if (normalizedStudentName.length() > 32) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "学生真实姓名长度不能超过32位");
        }

        if (joinType == null) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "加入方式不能为空");
        }

        SysUser currentUser = sysUserService.getCurrentUser();
        validateStudent(studentId);

        long memberCount = lambdaQuery()
                .eq(ClassroomMember::getClassroomId, classroomId)
                .eq(ClassroomMember::getStudentId, studentId)
                .eq(ClassroomMember::getDeleted, DeletedStatusEnum.NORMAL)
                .count();

        if (memberCount > 0) {
            throw new BusinessException(ResultCodeEnum.DATA_ALREADY_EXIST, "学生已经加入该课堂");
        }

        LocalDateTime now = LocalDateTime.now();

        ClassroomMember member = new ClassroomMember();
        member.setClassroomId(classroomId);
        member.setStudentId(studentId);
        member.setStudentName(normalizedStudentName);
        member.setJoinType(joinType);
        member.setJoinedTime(now);
        member.setCreatedById(currentUser.getId());
        member.setCreateTime(now);
        member.setUpdatedById(currentUser.getId());
        member.setUpdateTime(now);
        member.setDeleted(DeletedStatusEnum.NORMAL);

        if (!save(member)) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "添加课堂成员失败");
        }

        return member.getId();
    }

    /**
     * 校验学生用户
     *
     * @param studentId 学生用户ID
     */
    private void validateStudent(Long studentId) {
        SysUser student = sysUserService.lambdaQuery()
                .eq(SysUser::getId, studentId)
                .eq(SysUser::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (student == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "学生用户不存在");
        }

        if (student.getUserType() != UserTypeEnum.STUDENT) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "指定用户不是学生");
        }

        if (student.getStatus() != UserStatusEnum.ENABLED) {
            throw new BusinessException(ResultCodeEnum.ILLEGAL_STATE, "学生账号当前不可用");
        }
    }
}
