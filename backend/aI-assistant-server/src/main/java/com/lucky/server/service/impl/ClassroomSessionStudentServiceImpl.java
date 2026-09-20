package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ClassroomSessionStudentCheckInStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.domain.entity.ClassroomMember;
import com.lucky.server.domain.entity.ClassroomSessionStudent;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.mapper.ClassroomMemberMapper;
import com.lucky.server.mapper.ClassroomSessionStudentMapper;
import com.lucky.server.service.ClassroomSessionStudentService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 课堂课次学生记录 Service 实现
 *
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class ClassroomSessionStudentServiceImpl
        extends ServiceImpl<
                ClassroomSessionStudentMapper,
                ClassroomSessionStudent
        >
        implements ClassroomSessionStudentService {

    private final SysUserService sysUserService;

    private final ClassroomMemberMapper classroomMemberMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createClassroomSessionStudents(
            Long classroomId,
            Long classroomSessionId
    ) {
        if (classroomId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课堂ID不能为空"
            );
        }

        if (classroomSessionId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课次ID不能为空"
            );
        }

        long sessionStudentCount = lambdaQuery()
                .eq(
                        ClassroomSessionStudent::getClassroomSessionId,
                        classroomSessionId
                )
                .eq(
                        ClassroomSessionStudent::getDeleted,
                        DeletedStatusEnum.NORMAL
                )
                .count();

        if (sessionStudentCount > 0) {
            return;
        }

        List<ClassroomMember> classroomMembers =
                classroomMemberMapper.selectList(
                        Wrappers.<ClassroomMember>lambdaQuery()
                                .eq(
                                        ClassroomMember::getClassroomId,
                                        classroomId
                                )
                                .eq(
                                        ClassroomMember::getDeleted,
                                        DeletedStatusEnum.NORMAL
                                )
                );

        if (classroomMembers.isEmpty()) {
            return;
        }

        SysUser currentTeacher = sysUserService.getCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        List<ClassroomSessionStudent> sessionStudents =
                classroomMembers.stream()
                        .map(classroomMember -> {
                            ClassroomSessionStudent sessionStudent =
                                    new ClassroomSessionStudent();

                            sessionStudent.setClassroomId(classroomId);
                            sessionStudent.setClassroomSessionId(
                                    classroomSessionId
                            );
                            sessionStudent.setClassroomMemberId(
                                    classroomMember.getId()
                            );
                            sessionStudent.setStudentId(
                                    classroomMember.getStudentId()
                            );
                            sessionStudent.setStudentName(
                                    classroomMember.getStudentName()
                            );
                            sessionStudent.setCheckInStatus(
                                    ClassroomSessionStudentCheckInStatusEnum.ABSENT
                            );
                            sessionStudent.setCheckInTime(null);
                            sessionStudent.setCreatedById(
                                    currentTeacher.getId()
                            );
                            sessionStudent.setCreateTime(now);
                            sessionStudent.setUpdatedById(
                                    currentTeacher.getId()
                            );
                            sessionStudent.setUpdateTime(now);
                            sessionStudent.setDeleted(
                                    DeletedStatusEnum.NORMAL
                            );

                            return sessionStudent;
                        })
                        .toList();

        if (!saveBatch(sessionStudents)) {
            throw new BusinessException(
                    ResultCodeEnum.OPERATION_FAILED,
                    "创建课次学生记录失败"
            );
        }
    }
}
