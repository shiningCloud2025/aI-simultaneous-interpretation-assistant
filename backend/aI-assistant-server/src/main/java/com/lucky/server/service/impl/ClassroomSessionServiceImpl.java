package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ClassroomSessionStatusEnum;
import com.lucky.server.common.enums.ClassroomStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import com.lucky.server.domain.dto.ClassroomSessionPageQueryDTO;
import com.lucky.server.domain.dto.ClassroomSessionStartDTO;
import com.lucky.server.domain.entity.Classroom;
import com.lucky.server.domain.entity.ClassroomMember;
import com.lucky.server.domain.entity.ClassroomSession;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.ClassroomSessionDetailVO;
import com.lucky.server.domain.vo.ClassroomSessionListVO;
import com.lucky.server.mapper.ClassroomMapper;
import com.lucky.server.mapper.ClassroomMemberMapper;
import com.lucky.server.mapper.ClassroomSessionMapper;
import com.lucky.server.service.ClassroomSessionService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

    private final ClassroomMemberMapper classroomMemberMapper;

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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClassroomSessionDetailVO resumeClassroomSession(
            Long classroomSessionId
    ) {
        SysUser currentTeacher = sysUserService.getCurrentUser();

        if (currentTeacher.getUserType() != UserTypeEnum.TEACHER) {
            throw new BusinessException(
                    ResultCodeEnum.FORBIDDEN,
                    "只有老师可以继续课次"
            );
        }

        if (classroomSessionId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课次ID不能为空"
            );
        }

        ClassroomSession session = lambdaQuery()
                .eq(ClassroomSession::getId, classroomSessionId)
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
                    "只有本次开课的老师可以继续课次"
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
                    "已归档课堂不能继续课次"
            );
        }

        if (session.getStatus() != ClassroomSessionStatusEnum.PAUSED) {
            throw new BusinessException(
                    ResultCodeEnum.ILLEGAL_STATE,
                    "只有已暂停的课次可以继续"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        boolean updated = lambdaUpdate()
                .eq(ClassroomSession::getId, classroomSessionId)
                .eq(
                        ClassroomSession::getStatus,
                        ClassroomSessionStatusEnum.PAUSED
                )
                .eq(ClassroomSession::getDeleted, DeletedStatusEnum.NORMAL)
                .set(
                        ClassroomSession::getStatus,
                        ClassroomSessionStatusEnum.IN_PROGRESS
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
                ClassroomSessionStatusEnum.IN_PROGRESS,
                session.getStartTime(),
                session.getEndTime(),
                session.getCreateTime(),
                now
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClassroomSessionDetailVO endClassroomSession(
            Long classroomSessionId
    ) {
        SysUser currentTeacher = sysUserService.getCurrentUser();

        if (currentTeacher.getUserType() != UserTypeEnum.TEACHER) {
            throw new BusinessException(
                    ResultCodeEnum.FORBIDDEN,
                    "只有老师可以结束课次"
            );
        }

        if (classroomSessionId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课次ID不能为空"
            );
        }

        ClassroomSession session = lambdaQuery()
                .eq(ClassroomSession::getId, classroomSessionId)
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
                    "只有本次开课的老师可以结束课次"
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

        if (session.getStatus() == ClassroomSessionStatusEnum.ENDED) {
            throw new BusinessException(
                    ResultCodeEnum.ILLEGAL_STATE,
                    "课次已经结束"
            );
        }

        LocalDateTime now = LocalDateTime.now();

        boolean updated = lambdaUpdate()
                .eq(ClassroomSession::getId, classroomSessionId)
                .in(
                        ClassroomSession::getStatus,
                        ClassroomSessionStatusEnum.IN_PROGRESS,
                        ClassroomSessionStatusEnum.PAUSED
                )
                .eq(ClassroomSession::getDeleted, DeletedStatusEnum.NORMAL)
                .set(
                        ClassroomSession::getStatus,
                        ClassroomSessionStatusEnum.ENDED
                )
                .set(ClassroomSession::getEndTime, now)
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
                ClassroomSessionStatusEnum.ENDED,
                session.getStartTime(),
                now,
                session.getCreateTime(),
                now
        );
    }

    @Override
    public ClassroomSessionDetailVO getClassroomSessionDetail(
            Long classroomSessionId
    ) {
        if (classroomSessionId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课次ID不能为空"
            );
        }

        SysUser currentUser = sysUserService.getCurrentUser();

        ClassroomSession session = lambdaQuery()
                .eq(ClassroomSession::getId, classroomSessionId)
                .eq(ClassroomSession::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (session == null) {
            throw new BusinessException(
                    ResultCodeEnum.DATA_NOT_EXIST,
                    "课次不存在"
            );
        }

        getAccessibleClassroom(session.getClassroomId(), currentUser);
        return convertToDetailVO(session);
    }

    @Override
    public Page<ClassroomSessionListVO> pageClassroomSessions(
            Long classroomId,
            ClassroomSessionPageQueryDTO dto
    ) {
        SysUser currentUser = sysUserService.getCurrentUser();

        getAccessibleClassroom(classroomId, currentUser);

        LambdaQueryWrapper<ClassroomSession> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(ClassroomSession::getClassroomId, classroomId);
        wrapper.eq(ClassroomSession::getDeleted, DeletedStatusEnum.NORMAL);

        ClassroomSessionPageQueryDTO.Filter filter = dto.filter();

        if (filter != null) {
            if (filter.keyword() != null && !filter.keyword().isBlank()) {
                wrapper.like(
                        ClassroomSession::getSessionName,
                        filter.keyword().trim()
                );
            }

            if (filter.status() != null) {
                wrapper.eq(ClassroomSession::getStatus, filter.status());
            }
        }

        wrapper.orderByDesc(ClassroomSession::getStartTime);

        Page<ClassroomSession> pageResult = page(
                new Page<>(dto.page(), dto.size()),
                wrapper
        );
        List<ClassroomSessionListVO> records = pageResult.getRecords()
                .stream()
                .map(this::convertToListVO)
                .toList();

        Page<ClassroomSessionListVO> result = new Page<>();
        result.setRecords(records);
        result.setTotal(pageResult.getTotal());
        result.setSize(pageResult.getSize());
        result.setCurrent(pageResult.getCurrent());
        result.setPages(pageResult.getPages());
        return result;
    }

    /**
     * 获取当前用户有权查看的课堂
     *
     * 课堂所属老师和有效课堂成员可以访问。
     *
     * @param classroomId 课堂ID
     * @param currentUser 当前登录用户
     * @return 课堂实体
     */
    private Classroom getAccessibleClassroom(
            Long classroomId,
            SysUser currentUser
    ) {
        if (classroomId == null) {
            throw new BusinessException(
                    ResultCodeEnum.PARAM_ERROR,
                    "课堂ID不能为空"
            );
        }

        Classroom classroom = classroomMapper.selectOne(
                Wrappers.<Classroom>lambdaQuery()
                        .eq(Classroom::getId, classroomId)
                        .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL)
        );

        if (classroom == null) {
            throw new BusinessException(
                    ResultCodeEnum.DATA_NOT_EXIST,
                    "课堂不存在"
            );
        }

        if (currentUser.getUserType() == UserTypeEnum.TEACHER) {
            if (!classroom.getTeacherId().equals(currentUser.getId())) {
                throw new BusinessException(
                        ResultCodeEnum.FORBIDDEN,
                        "无权查看该课堂课次"
                );
            }

            return classroom;
        }

        if (currentUser.getUserType() == UserTypeEnum.STUDENT) {
            long memberCount = classroomMemberMapper.selectCount(
                    Wrappers.<ClassroomMember>lambdaQuery()
                            .eq(ClassroomMember::getClassroomId, classroomId)
                            .eq(ClassroomMember::getStudentId, currentUser.getId())
                            .eq(ClassroomMember::getDeleted, DeletedStatusEnum.NORMAL)
            );

            if (memberCount == 0) {
                throw new BusinessException(
                        ResultCodeEnum.FORBIDDEN,
                        "加入课堂后才能查看课次"
                );
            }

            return classroom;
        }

        throw new BusinessException(
                ResultCodeEnum.FORBIDDEN,
                "无权查看课堂课次"
        );
    }

    /**
     * 将课次实体转换为课次详情VO
     *
     * @param session 课次实体
     * @return 课次详情VO
     */
    private ClassroomSessionDetailVO convertToDetailVO(
            ClassroomSession session
    ) {
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

    /**
     * 将课次实体转换为课次列表VO
     *
     * @param session 课次实体
     * @return 课次列表VO
     */
    private ClassroomSessionListVO convertToListVO(
            ClassroomSession session
    ) {
        return new ClassroomSessionListVO(
                session.getId(),
                session.getTeacherId(),
                session.getSessionName(),
                session.getStatus(),
                session.getStartTime(),
                session.getEndTime()
        );
    }
}
