package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ClassroomMemberJoinTypeEnum;
import com.lucky.server.common.enums.ClassroomStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.UserStatusEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import com.lucky.server.domain.dto.ClassroomMemberUpdateDTO;
import com.lucky.server.domain.entity.Classroom;
import com.lucky.server.domain.entity.ClassroomMember;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.ClassroomMemberDetailVO;
import com.lucky.server.mapper.ClassroomMapper;
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

    private final ClassroomMapper classroomMapper;

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

    @Override
    public ClassroomMemberDetailVO updateMyClassroomMember(Long classroomMemberId,
            ClassroomMemberUpdateDTO dto
    ) {
        SysUser currentStudent = sysUserService.getCurrentUser();

        if (currentStudent.getUserType() != UserTypeEnum.STUDENT) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "只有学生可以修改自己的课堂成员信息");
        }

        ClassroomMember member = lambdaQuery()
                .eq(ClassroomMember::getId, classroomMemberId)
                .eq(ClassroomMember::getStudentId, currentStudent.getId())
                .eq(ClassroomMember::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (member == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "课堂成员不存在");
        }

        Classroom classroom = classroomMapper.selectOne(Wrappers.<Classroom>lambdaQuery()
                .eq(Classroom::getId, member.getClassroomId())
                .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL));

        if (classroom == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "课堂不存在");
        }

        if (classroom.getStatus() != ClassroomStatusEnum.NORMAL) {
            throw new BusinessException(ResultCodeEnum.ILLEGAL_STATE, "已归档课堂不能修改成员信息");
        }

        String studentName = dto.studentName().trim();
        LocalDateTime now = LocalDateTime.now();

        boolean updated = lambdaUpdate()
                .eq(ClassroomMember::getId, classroomMemberId)
                .eq(ClassroomMember::getStudentId, currentStudent.getId())
                .eq(ClassroomMember::getDeleted, DeletedStatusEnum.NORMAL)
                .set(ClassroomMember::getStudentName, studentName)
                .set(ClassroomMember::getUpdatedById, currentStudent.getId())
                .set(ClassroomMember::getUpdateTime, now)
                .update();

        if (!updated) {
            throw new BusinessException(ResultCodeEnum.CONFLICT, "课堂成员信息已发生变化，请刷新后重试");
        }

        return new ClassroomMemberDetailVO(
                member.getId(),
                member.getClassroomId(),
                member.getStudentId(),
                studentName,
                member.getJoinType(),
                member.getJoinedTime(),
                now
        );
    }

    @Override
    public ClassroomMemberDetailVO updateClassroomMember(Long classroomMemberId,
            ClassroomMemberUpdateDTO dto
    ) {
        SysUser currentTeacher = sysUserService.getCurrentUser();

        if (currentTeacher.getUserType() != UserTypeEnum.TEACHER) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "只有老师可以修改课堂成员信息");
        }

        ClassroomMember member = lambdaQuery()
                .eq(ClassroomMember::getId, classroomMemberId)
                .eq(ClassroomMember::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (member == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "课堂成员不存在");
        }

        Classroom classroom = classroomMapper.selectOne(Wrappers.<Classroom>lambdaQuery()
                .eq(Classroom::getId, member.getClassroomId())
                .eq(Classroom::getTeacherId, currentTeacher.getId())
                .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL));

        if (classroom == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "课堂不存在");
        }

        if (classroom.getStatus() != ClassroomStatusEnum.NORMAL) {
            throw new BusinessException(ResultCodeEnum.ILLEGAL_STATE, "已归档课堂不能修改成员信息");
        }

        String studentName = dto.studentName().trim();
        LocalDateTime now = LocalDateTime.now();

        boolean updated = lambdaUpdate()
                .eq(ClassroomMember::getId, classroomMemberId)
                .eq(ClassroomMember::getDeleted, DeletedStatusEnum.NORMAL)
                .set(ClassroomMember::getStudentName, studentName)
                .set(ClassroomMember::getUpdatedById, currentTeacher.getId())
                .set(ClassroomMember::getUpdateTime, now)
                .update();

        if (!updated) {
            throw new BusinessException(ResultCodeEnum.CONFLICT, "课堂成员信息已发生变化，请刷新后重试");
        }

        return new ClassroomMemberDetailVO(
                member.getId(),
                member.getClassroomId(),
                member.getStudentId(),
                studentName,
                member.getJoinType(),
                member.getJoinedTime(),
                now
        );
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
