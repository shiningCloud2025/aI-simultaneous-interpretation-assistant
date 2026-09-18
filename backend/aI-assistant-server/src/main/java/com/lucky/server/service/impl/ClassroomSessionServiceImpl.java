package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ClassroomSessionStatusEnum;
import com.lucky.server.common.enums.ClassroomStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import com.lucky.server.domain.dto.ClassroomSessionStartDTO;
import com.lucky.server.domain.entity.Classroom;
import com.lucky.server.domain.entity.ClassroomSession;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.ClassroomSessionDetailVO;
import com.lucky.server.mapper.ClassroomMapper;
import com.lucky.server.mapper.ClassroomSessionMapper;
import com.lucky.server.service.ClassroomSessionService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 课堂开课记录 Service 实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class ClassroomSessionServiceImpl
        extends ServiceImpl<ClassroomSessionMapper, ClassroomSession>
        implements ClassroomSessionService {

    private final SysUserService sysUserService;

    private final ClassroomMapper classroomMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClassroomSessionDetailVO startClassroomSession(
            Long classroomId,
            ClassroomSessionStartDTO dto
    ) {
        SysUser currentTeacher = sysUserService.getCurrentUser();

        if (currentTeacher.getUserType() != UserTypeEnum.TEACHER) {
            throw new BusinessException(
                    ResultCodeEnum.FORBIDDEN,
                    "只有老师可以开课"
            );
        }

        if (classroomId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课堂ID不能为空"
            );
        }

        Classroom classroom = classroomMapper.selectOne(
                Wrappers.<Classroom>lambdaQuery()
                        .eq(Classroom::getId, classroomId)
                        .eq(Classroom::getTeacherId, currentTeacher.getId())
                        .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL)
        );

        if (classroom == null) {
            throw new BusinessException(
                    ResultCodeEnum.DATA_NOT_EXIST,
                    "课堂不存在"
            );
        }

        if (classroom.getStatus() != ClassroomStatusEnum.NORMAL) {
            throw new BusinessException(
                    ResultCodeEnum.ILLEGAL_STATE,
                    "已归档课堂不能开课"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        ClassroomSession session = new ClassroomSession();
        session.setClassroomId(classroomId);
        session.setTeacherId(currentTeacher.getId());
        session.setSessionName(dto.sessionName().trim());
        session.setStatus(ClassroomSessionStatusEnum.IN_PROGRESS);
        session.setStartTime(now);
        session.setEndTime(null);
        session.setCreatedById(currentTeacher.getId());
        session.setCreateTime(now);
        session.setUpdatedById(currentTeacher.getId());
        session.setUpdateTime(now);
        session.setDeleted(DeletedStatusEnum.NORMAL);

        if (!save(session)) {
            throw new BusinessException(
                    ResultCodeEnum.OPERATION_FAILED,
                    "开课失败"
            );
        }

        return new ClassroomSessionDetailVO(
                session.getId(),
                session.getClassroomId(),
                session.getTeacherId(),
                session.getSessionName(),
                session.getStatus(),
                session.getStartTime(),
                session.getEndTime(),
                session.getCreateTime(),
                session.getUpdateTime()
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClassroomSessionDetailVO pauseClassroomSession(Long sessionId) {
        SysUser currentTeacher = sysUserService.getCurrentUser();

        if (currentTeacher.getUserType() != UserTypeEnum.TEACHER) {
            throw new BusinessException(
                    ResultCodeEnum.FORBIDDEN,
                    "只有老师可以暂停课次"
            );
        }

        if (sessionId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课次ID不能为空"
            );
        }

        ClassroomSession session = lambdaQuery()
                .eq(ClassroomSession::getId, sessionId)
                .eq(ClassroomSession::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (session == null) {
            throw new BusinessException(
                    ResultCodeEnum.DATA_NOT_EXIST,
                    "课次不存在"
            );
        }

        if (!session.getTeacherId().equals(currentTeacher.getId())) {
            throw new BusinessException(
                    ResultCodeEnum.FORBIDDEN,
                    "只有本次开课的老师可以暂停课次"
            );
        }

        Classroom classroom = classroomMapper.selectOne(
                Wrappers.<Classroom>lambdaQuery()
                        .eq(Classroom::getId, session.getClassroomId())
                        .eq(Classroom::getTeacherId, currentTeacher.getId())
                        .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL)
        );

        if (classroom == null) {
            throw new BusinessException(
                    ResultCodeEnum.DATA_NOT_EXIST,
                    "课堂不存在"
            );
        }

        if (classroom.getStatus() != ClassroomStatusEnum.NORMAL) {
            throw new BusinessException(
                    ResultCodeEnum.ILLEGAL_STATE,
                    "已归档课堂不能暂停课次"
            );
        }

        if (session.getStatus() != ClassroomSessionStatusEnum.IN_PROGRESS) {
            throw new BusinessException(
                    ResultCodeEnum.ILLEGAL_STATE,
                    "只有进行中的课次可以暂停"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        boolean updated = lambdaUpdate()
                .eq(ClassroomSession::getId, sessionId)
                .eq(
                        ClassroomSession::getStatus,
                        ClassroomSessionStatusEnum.IN_PROGRESS
                )
                .eq(ClassroomSession::getDeleted, DeletedStatusEnum.NORMAL)
                .set(
                        ClassroomSession::getStatus,
                        ClassroomSessionStatusEnum.PAUSED
                )
                .set(
                        ClassroomSession::getUpdatedById,
                        currentTeacher.getId()
                )
                .set(ClassroomSession::getUpdateTime, now)
                .update();

        if (!updated) {
            throw new BusinessException(
                    ResultCodeEnum.CONFLICT,
                    "课次状态已发生变化，请刷新后重试"
            );
        }

        return new ClassroomSessionDetailVO(
                session.getId(),
                session.getClassroomId(),
                session.getTeacherId(),
                session.getSessionName(),
                ClassroomSessionStatusEnum.PAUSED,
                session.getStartTime(),
                session.getEndTime(),
                session.getCreateTime(),
                now
        );
    }
}
