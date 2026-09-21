package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ClassroomSessionStatusEnum;
import com.lucky.server.common.enums.ClassroomSessionStudentCheckInStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import com.lucky.server.domain.dto.ClassroomSessionStudentPageQueryDTO;
import com.lucky.server.domain.entity.ClassroomMember;
import com.lucky.server.domain.entity.ClassroomSession;
import com.lucky.server.domain.entity.ClassroomSessionStudent;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.ClassroomSessionStudentDetailVO;
import com.lucky.server.domain.vo.ClassroomSessionStudentListVO;
import com.lucky.server.mapper.ClassroomMemberMapper;
import com.lucky.server.mapper.ClassroomSessionMapper;
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

    private final ClassroomSessionMapper classroomSessionMapper;

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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClassroomSessionStudentDetailVO checkIn(
            Long classroomSessionId
    ) {
        SysUser currentStudent = sysUserService.getCurrentUser();

        if (currentStudent.getUserType() != UserTypeEnum.STUDENT) {
            throw new BusinessException(
                    ResultCodeEnum.FORBIDDEN,
                    "只有学生可以签到"
            );
        }

        ClassroomSession classroomSession =
                getClassroomSession(classroomSessionId);

        if (classroomSession.getStatus()
                != ClassroomSessionStatusEnum.IN_PROGRESS) {
            throw new BusinessException(
                    ResultCodeEnum.ILLEGAL_STATE,
                    "只有进行中的课次可以签到"
            );
        }

        ClassroomSessionStudent sessionStudent =
                lambdaQuery()
                        .eq(
                                ClassroomSessionStudent
                                        ::getClassroomSessionId,
                                classroomSessionId
                        )
                        .eq(
                                ClassroomSessionStudent::getStudentId,
                                currentStudent.getId()
                        )
                        .eq(
                                ClassroomSessionStudent::getDeleted,
                                DeletedStatusEnum.NORMAL
                        )
                        .one();

        if (sessionStudent == null) {
            throw new BusinessException(
                    ResultCodeEnum.DATA_NOT_EXIST,
                    "你不在本次课次的学生名单中"
            );
        }

        if (sessionStudent.getCheckInStatus()
                == ClassroomSessionStudentCheckInStatusEnum.PRESENT) {
            return convertToDetailVO(sessionStudent);
        }

        LocalDateTime now = LocalDateTime.now();

        boolean updated = lambdaUpdate()
                .eq(
                        ClassroomSessionStudent::getId,
                        sessionStudent.getId()
                )
                .eq(
                        ClassroomSessionStudent::getStudentId,
                        currentStudent.getId()
                )
                .eq(
                        ClassroomSessionStudent::getCheckInStatus,
                        ClassroomSessionStudentCheckInStatusEnum.ABSENT
                )
                .eq(
                        ClassroomSessionStudent::getDeleted,
                        DeletedStatusEnum.NORMAL
                )
                .set(
                        ClassroomSessionStudent::getCheckInStatus,
                        ClassroomSessionStudentCheckInStatusEnum.PRESENT
                )
                .set(
                        ClassroomSessionStudent::getCheckInTime,
                        now
                )
                .set(
                        ClassroomSessionStudent::getUpdatedById,
                        currentStudent.getId()
                )
                .set(
                        ClassroomSessionStudent::getUpdateTime,
                        now
                )
                .update();

        if (!updated) {
            throw new BusinessException(
                    ResultCodeEnum.CONFLICT,
                    "签到状态已发生变化，请刷新后重试"
            );
        }

        sessionStudent.setCheckInStatus(
                ClassroomSessionStudentCheckInStatusEnum.PRESENT
        );
        sessionStudent.setCheckInTime(now);

        return convertToDetailVO(sessionStudent);
    }

    @Override
    public ClassroomSessionStudentDetailVO
            getClassroomSessionStudentDetail(
                    Long classroomSessionStudentId
            ) {
        if (classroomSessionStudentId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课次学生记录ID不能为空"
            );
        }

        SysUser currentUser = sysUserService.getCurrentUser();

        ClassroomSessionStudent sessionStudent =
                lambdaQuery()
                        .eq(
                                ClassroomSessionStudent::getId,
                                classroomSessionStudentId
                        )
                        .eq(
                                ClassroomSessionStudent::getDeleted,
                                DeletedStatusEnum.NORMAL
                        )
                        .one();

        if (sessionStudent == null) {
            throw new BusinessException(
                    ResultCodeEnum.DATA_NOT_EXIST,
                    "课次学生记录不存在"
            );
        }

        ClassroomSession classroomSession =
                getClassroomSession(
                        sessionStudent.getClassroomSessionId()
                );

        validateClassroomSessionAccess(
                classroomSession,
                currentUser
        );

        return convertToDetailVO(sessionStudent);
    }

    @Override
    public Page<ClassroomSessionStudentListVO>
            pageClassroomSessionStudents(
                    Long classroomSessionId,
                    ClassroomSessionStudentPageQueryDTO dto
            ) {
        SysUser currentUser = sysUserService.getCurrentUser();

        ClassroomSession classroomSession =
                getClassroomSession(classroomSessionId);

        validateClassroomSessionAccess(
                classroomSession,
                currentUser
        );

        LambdaQueryWrapper<ClassroomSessionStudent> wrapper =
                Wrappers.lambdaQuery();

        wrapper.eq(
                ClassroomSessionStudent::getClassroomSessionId,
                classroomSessionId
        );
        wrapper.eq(
                ClassroomSessionStudent::getDeleted,
                DeletedStatusEnum.NORMAL
        );

        ClassroomSessionStudentPageQueryDTO.Filter filter =
                dto.filter();

        if (filter != null) {
            if (filter.studentName() != null
                    && !filter.studentName().isBlank()) {
                wrapper.like(
                        ClassroomSessionStudent::getStudentName,
                        filter.studentName().trim()
                );
            }

            if (filter.checkInStatus() != null) {
                wrapper.eq(
                        ClassroomSessionStudent::getCheckInStatus,
                        filter.checkInStatus()
                );
            }
        }

        wrapper.orderByAsc(ClassroomSessionStudent::getId);

        Page<ClassroomSessionStudent> pageResult = page(
                new Page<>(dto.page(), dto.size()),
                wrapper
        );

        List<ClassroomSessionStudentListVO> records =
                pageResult.getRecords()
                        .stream()
                        .map(this::convertToListVO)
                        .toList();

        Page<ClassroomSessionStudentListVO> result =
                new Page<>();

        result.setRecords(records);
        result.setTotal(pageResult.getTotal());
        result.setSize(pageResult.getSize());
        result.setCurrent(pageResult.getCurrent());
        result.setPages(pageResult.getPages());

        return result;
    }

    /**
     * 获取正常状态的课次
     *
     * @param classroomSessionId 课次ID
     * @return 课次实体
     */
    private ClassroomSession getClassroomSession(
            Long classroomSessionId
    ) {
        if (classroomSessionId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课次ID不能为空"
            );
        }

        ClassroomSession classroomSession =
                classroomSessionMapper.selectOne(
                        Wrappers.<ClassroomSession>lambdaQuery()
                                .eq(
                                        ClassroomSession::getId,
                                        classroomSessionId
                                )
                                .eq(
                                        ClassroomSession::getDeleted,
                                        DeletedStatusEnum.NORMAL
                                )
                );

        if (classroomSession == null) {
            throw new BusinessException(
                    ResultCodeEnum.DATA_NOT_EXIST,
                    "课次不存在"
            );
        }

        return classroomSession;
    }

    /**
     * 校验课次学生记录查看权限
     *
     * 本次开课老师和本次课次名单中的学生可以查看。
     *
     * @param classroomSession 课次实体
     * @param currentUser 当前登录用户
     */
    private void validateClassroomSessionAccess(
            ClassroomSession classroomSession,
            SysUser currentUser
    ) {
        if (currentUser.getUserType() == UserTypeEnum.TEACHER) {
            if (!classroomSession.getTeacherId()
                    .equals(currentUser.getId())) {
                throw new BusinessException(
                        ResultCodeEnum.FORBIDDEN,
                        "无权查看本次课次的学生记录"
                );
            }

            return;
        }

        if (currentUser.getUserType() == UserTypeEnum.STUDENT) {
            long sessionStudentCount = lambdaQuery()
                    .eq(
                            ClassroomSessionStudent
                                    ::getClassroomSessionId,
                            classroomSession.getId()
                    )
                    .eq(
                            ClassroomSessionStudent::getStudentId,
                            currentUser.getId()
                    )
                    .eq(
                            ClassroomSessionStudent::getDeleted,
                            DeletedStatusEnum.NORMAL
                    )
                    .count();

            if (sessionStudentCount == 0) {
                throw new BusinessException(
                        ResultCodeEnum.FORBIDDEN,
                        "你不在本次课次的学生名单中"
                );
            }

            return;
        }

        throw new BusinessException(
                ResultCodeEnum.FORBIDDEN,
                "无权查看本次课次的学生记录"
        );
    }

    /**
     * 将课次学生实体转换为详情VO
     *
     * @param sessionStudent 课次学生实体
     * @return 课次学生详情
     */
    private ClassroomSessionStudentDetailVO convertToDetailVO(
            ClassroomSessionStudent sessionStudent
    ) {
        return new ClassroomSessionStudentDetailVO(
                sessionStudent.getId(),
                sessionStudent.getClassroomId(),
                sessionStudent.getClassroomSessionId(),
                sessionStudent.getClassroomMemberId(),
                sessionStudent.getStudentId(),
                sessionStudent.getStudentName(),
                sessionStudent.getCheckInStatus(),
                sessionStudent.getCheckInTime()
        );
    }

    /**
     * 将课次学生实体转换为列表VO
     *
     * @param sessionStudent 课次学生实体
     * @return 课次学生列表数据
     */
    private ClassroomSessionStudentListVO convertToListVO(
            ClassroomSessionStudent sessionStudent
    ) {
        return new ClassroomSessionStudentListVO(
                sessionStudent.getId(),
                sessionStudent.getClassroomMemberId(),
                sessionStudent.getStudentId(),
                sessionStudent.getStudentName(),
                sessionStudent.getCheckInStatus(),
                sessionStudent.getCheckInTime()
        );
    }
}
