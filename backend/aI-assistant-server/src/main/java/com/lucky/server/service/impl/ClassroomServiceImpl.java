package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ClassroomMemberJoinTypeEnum;
import com.lucky.server.common.enums.ClassroomStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import com.lucky.server.domain.dto.ClassroomCreateDTO;
import com.lucky.server.domain.dto.ClassroomJoinDTO;
import com.lucky.server.domain.dto.ClassroomPageQueryDTO;
import com.lucky.server.domain.dto.ClassroomUpdateDTO;
import com.lucky.server.domain.dto.StudentClassroomPageQueryDTO;
import com.lucky.server.domain.entity.Classroom;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.ClassroomDetailVO;
import com.lucky.server.domain.vo.ClassroomInviteVO;
import com.lucky.server.domain.vo.ClassroomListVO;
import com.lucky.server.domain.vo.StudentClassroomDetailVO;
import com.lucky.server.domain.vo.StudentClassroomListVO;
import com.lucky.server.mapper.ClassroomMapper;
import com.lucky.server.service.ClassroomMemberService;
import com.lucky.server.service.ClassroomService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 课堂 Service 实现
 * @author shiningCloud2025
 */
@Service
@RequiredArgsConstructor
public class ClassroomServiceImpl extends ServiceImpl<ClassroomMapper, Classroom> implements ClassroomService {

    private static final String INVITE_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private static final int INVITE_CODE_LENGTH = 8;

    private static final int INVITE_CODE_MAX_RETRIES = 10;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final Pattern ACADEMIC_YEAR_PATTERN = Pattern.compile("^(\\d{4})-(\\d{4})$");

    private final SysUserService sysUserService;

    private final ClassroomMemberService classroomMemberService;

    @Override
    public ClassroomDetailVO createClassroom(ClassroomCreateDTO dto) {
        SysUser currentTeacher = getCurrentTeacher();
        String academicYear = normalizeAcademicYear(dto.academicYear());
        LocalDateTime now = LocalDateTime.now();

        Classroom classroom = new Classroom();
        classroom.setTeacherId(currentTeacher.getId());
        classroom.setName(dto.name().trim());
        classroom.setLanguageCode(dto.languageCode());
        classroom.setStageCode(dto.stageCode());
        classroom.setAcademicYear(academicYear);
        classroom.setSemesterCode(dto.semesterCode());
        classroom.setDescription(dto.description());
        classroom.setInviteCode(generateInviteCode());
        classroom.setStatus(ClassroomStatusEnum.NORMAL);
        classroom.setCreatedById(currentTeacher.getId());
        classroom.setCreateTime(now);
        classroom.setUpdatedById(currentTeacher.getId());
        classroom.setUpdateTime(now);
        classroom.setDeleted(DeletedStatusEnum.NORMAL);

        if (!save(classroom)) {
            throw new BusinessException(ResultCodeEnum.OPERATION_FAILED, "创建课堂失败");
        }

        return convertToDetailVO(classroom);
    }

    @Override
    public ClassroomDetailVO updateClassroom(Long classroomId, ClassroomUpdateDTO dto) {
        SysUser currentTeacher = getCurrentTeacher();
        Classroom classroom = getOwnedClassroom(classroomId, currentTeacher.getId());

        ensureClassroomNormal(classroom);

        LocalDateTime now = LocalDateTime.now();

        boolean updated = lambdaUpdate()
                .eq(Classroom::getId, classroomId)
                .eq(Classroom::getTeacherId, currentTeacher.getId())
                .eq(Classroom::getStatus, ClassroomStatusEnum.NORMAL)
                .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL)
                .set(Classroom::getName, dto.name().trim())
                .set(Classroom::getDescription, dto.description())
                .set(Classroom::getUpdatedById, currentTeacher.getId())
                .set(Classroom::getUpdateTime, now)
                .update();

        if (!updated) {
            throw new BusinessException(ResultCodeEnum.CONFLICT, "课堂信息已发生变化，请刷新后重试");
        }

        Classroom updatedClassroom = getOwnedClassroom(classroomId, currentTeacher.getId());
        return convertToDetailVO(updatedClassroom);
    }

    @Override
    public ClassroomInviteVO refreshInviteCode(Long classroomId) {
        SysUser currentTeacher = getCurrentTeacher();
        Classroom classroom = getOwnedClassroom(classroomId, currentTeacher.getId());

        ensureClassroomNormal(classroom);

        String inviteCode = generateInviteCode();
        LocalDateTime now = LocalDateTime.now();

        boolean updated = lambdaUpdate()
                .eq(Classroom::getId, classroomId)
                .eq(Classroom::getTeacherId, currentTeacher.getId())
                .eq(Classroom::getStatus, ClassroomStatusEnum.NORMAL)
                .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL)
                .set(Classroom::getInviteCode, inviteCode)
                .set(Classroom::getUpdatedById, currentTeacher.getId())
                .set(Classroom::getUpdateTime, now)
                .update();

        if (!updated) {
            throw new BusinessException(ResultCodeEnum.CONFLICT, "课堂信息已发生变化，请刷新后重试");
        }

        return new ClassroomInviteVO(inviteCode);
    }

    @Override
    public void archiveClassroom(Long classroomId) {
        SysUser currentTeacher = getCurrentTeacher();
        Classroom classroom = getOwnedClassroom(classroomId, currentTeacher.getId());

        ensureClassroomNormal(classroom);

        LocalDateTime now = LocalDateTime.now();

        boolean updated = lambdaUpdate()
                .eq(Classroom::getId, classroomId)
                .eq(Classroom::getTeacherId, currentTeacher.getId())
                .eq(Classroom::getStatus, ClassroomStatusEnum.NORMAL)
                .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL)
                .set(Classroom::getStatus, ClassroomStatusEnum.ARCHIVED)
                .set(Classroom::getUpdatedById, currentTeacher.getId())
                .set(Classroom::getUpdateTime, now)
                .update();

        if (!updated) {
            throw new BusinessException(ResultCodeEnum.CONFLICT, "课堂状态已发生变化，请刷新后重试");
        }
    }

    @Override
    public ClassroomDetailVO getMyClassroomDetail(Long classroomId) {
        SysUser currentTeacher = getCurrentTeacher();
        Classroom classroom = getOwnedClassroom(classroomId, currentTeacher.getId());
        return convertToDetailVO(classroom);
    }

    @Override
    public Page<ClassroomListVO> pageMyClassrooms(ClassroomPageQueryDTO dto) {
        SysUser currentTeacher = getCurrentTeacher();

        LambdaQueryWrapper<Classroom> wrapper = Wrappers.lambdaQuery();
        wrapper.eq(Classroom::getTeacherId, currentTeacher.getId());
        wrapper.eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL);

        ClassroomPageQueryDTO.Filter filter = dto.filter();

        if (filter != null) {
            if (filter.keyword() != null && !filter.keyword().isBlank()) {
                wrapper.like(Classroom::getName, filter.keyword().trim());
            }

            if (filter.status() != null) {
                wrapper.eq(Classroom::getStatus, filter.status());
            }
        }

        wrapper.orderByDesc(Classroom::getStatus);
        wrapper.orderByDesc(Classroom::getUpdateTime);

        Page<Classroom> pageResult = page(new Page<>(dto.page(), dto.size()), wrapper);
        List<ClassroomListVO> records = pageResult.getRecords()
                .stream()
                .map(this::convertToListVO)
                .toList();

        Page<ClassroomListVO> result = new Page<>();
        result.setRecords(records);
        result.setTotal(pageResult.getTotal());
        result.setSize(pageResult.getSize());
        result.setCurrent(pageResult.getCurrent());
        result.setPages(pageResult.getPages());
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ClassroomDetailVO joinClassroom(ClassroomJoinDTO dto) {
        SysUser currentStudent = getCurrentStudent();
        Classroom classroom = getNormalClassroomByInviteCode(dto.inviteCode());

        classroomMemberService.addClassroomMember(
                classroom.getId(),
                currentStudent.getId(),
                dto.studentName().trim(),
                ClassroomMemberJoinTypeEnum.INVITE_CODE
        );

        return convertToDetailVO(classroom);
    }

    @Override
    public Page<StudentClassroomListVO> pageMyJoinedClassrooms(
            StudentClassroomPageQueryDTO dto
    ) {
        SysUser currentStudent = getCurrentStudent();

        String keyword = null;
        ClassroomStatusEnum status = null;
        StudentClassroomPageQueryDTO.Filter filter = dto.filter();

        if (filter != null) {
            if (filter.keyword() != null && !filter.keyword().isBlank()) {
                keyword = filter.keyword().trim();
            }

            status = filter.status();
        }

        Page<StudentClassroomListVO> page = new Page<>(dto.page(), dto.size());
        return baseMapper.selectMyJoinedClassroomPage(
                page,
                currentStudent.getId(),
                keyword,
                status
        );
    }

    @Override
    public StudentClassroomDetailVO getMyJoinedClassroomDetail(Long classroomId) {
        SysUser currentStudent = getCurrentStudent();
        StudentClassroomDetailVO detail = baseMapper.selectMyJoinedClassroomDetail(
                classroomId,
                currentStudent.getId()
        );

        if (detail == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "尚未加入该课堂或课堂不存在");
        }

        return detail;
    }

    @Override
    public Classroom getNormalClassroomByInviteCode(String inviteCode) {
        if (inviteCode == null || inviteCode.isBlank()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "课堂邀请码不能为空");
        }

        String normalizedInviteCode = inviteCode.trim().toUpperCase(Locale.ROOT);

        if (normalizedInviteCode.length() != INVITE_CODE_LENGTH) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "课堂邀请码格式不正确");
        }

        Classroom classroom = lambdaQuery()
                .eq(Classroom::getInviteCode, normalizedInviteCode)
                .eq(Classroom::getStatus, ClassroomStatusEnum.NORMAL)
                .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (classroom == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "课堂邀请码无效");
        }

        return classroom;
    }

    /**
     * 获取当前登录老师
     *
     * @return 当前登录老师
     */
    private SysUser getCurrentTeacher() {
        SysUser currentUser = sysUserService.getCurrentUser();

        if (currentUser.getUserType() != UserTypeEnum.TEACHER) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "只有老师可以管理课堂");
        }

        return currentUser;
    }

    /**
     * 获取当前登录学生
     *
     * @return 当前登录学生
     */
    private SysUser getCurrentStudent() {
        SysUser currentUser = sysUserService.getCurrentUser();

        if (currentUser.getUserType() != UserTypeEnum.STUDENT) {
            throw new BusinessException(ResultCodeEnum.FORBIDDEN, "只有学生可以执行此操作");
        }

        return currentUser;
    }

    /**
     * 获取当前老师拥有的课堂
     *
     * @param classroomId 课堂ID
     * @param teacherId 老师用户ID
     * @return 课堂实体
     */
    private Classroom getOwnedClassroom(Long classroomId, Long teacherId) {
        Classroom classroom = lambdaQuery()
                .eq(Classroom::getId, classroomId)
                .eq(Classroom::getTeacherId, teacherId)
                .eq(Classroom::getDeleted, DeletedStatusEnum.NORMAL)
                .one();

        if (classroom == null) {
            throw new BusinessException(ResultCodeEnum.DATA_NOT_EXIST, "课堂不存在");
        }

        return classroom;
    }

    /**
     * 校验课堂是否处于正常状态
     *
     * @param classroom 课堂实体
     */
    private void ensureClassroomNormal(Classroom classroom) {
        if (classroom.getStatus() != ClassroomStatusEnum.NORMAL) {
            throw new BusinessException(ResultCodeEnum.ILLEGAL_STATE, "已归档课堂不能执行此操作");
        }
    }

    /**
     * 校验并规范化学年
     *
     * @param academicYear 学年
     * @return 规范化后的学年
     */
    private String normalizeAcademicYear(String academicYear) {
        if (academicYear == null) {
            return null;
        }

        String normalizedAcademicYear = academicYear.trim();
        Matcher matcher = ACADEMIC_YEAR_PATTERN.matcher(normalizedAcademicYear);

        if (!matcher.matches()) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "学年格式必须为YYYY-YYYY");
        }

        int startYear = Integer.parseInt(matcher.group(1));
        int endYear = Integer.parseInt(matcher.group(2));

        if (endYear != startYear + 1) {
            throw new BusinessException(ResultCodeEnum.PARAM_ERROR, "学年必须为连续年份");
        }

        return normalizedAcademicYear;
    }

    /**
     * 生成不重复的8位课堂邀请码
     *
     * @return 课堂邀请码
     */
    private String generateInviteCode() {
        for (int retry = 0; retry < INVITE_CODE_MAX_RETRIES; retry++) {
            StringBuilder codeBuilder = new StringBuilder(INVITE_CODE_LENGTH);

            for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
                int index = SECURE_RANDOM.nextInt(INVITE_CODE_CHARACTERS.length());
                codeBuilder.append(INVITE_CODE_CHARACTERS.charAt(index));
            }

            String inviteCode = codeBuilder.toString();
            long count = lambdaQuery()
                    .eq(Classroom::getInviteCode, inviteCode)
                    .count();

            if (count == 0) {
                return inviteCode;
            }
        }

        throw new BusinessException(ResultCodeEnum.SYSTEM_ERROR, "生成课堂邀请码失败，请重试");
    }

    /**
     * 将课堂实体转换为课堂详情VO
     *
     * @param classroom 课堂实体
     * @return 课堂详情VO
     */
    private ClassroomDetailVO convertToDetailVO(Classroom classroom) {
        return new ClassroomDetailVO(
                classroom.getId(),
                classroom.getTeacherId(),
                classroom.getName(),
                classroom.getLanguageCode(),
                classroom.getStageCode(),
                classroom.getAcademicYear(),
                classroom.getSemesterCode(),
                classroom.getDescription(),
                classroom.getInviteCode(),
                classroom.getStatus(),
                classroom.getCreateTime(),
                classroom.getUpdateTime()
        );
    }

    /**
     * 将课堂实体转换为课堂列表VO
     *
     * @param classroom 课堂实体
     * @return 课堂列表VO
     */
    private ClassroomListVO convertToListVO(Classroom classroom) {
        return new ClassroomListVO(
                classroom.getId(),
                classroom.getName(),
                classroom.getLanguageCode(),
                classroom.getStageCode(),
                classroom.getAcademicYear(),
                classroom.getSemesterCode(),
                classroom.getInviteCode(),
                classroom.getStatus(),
                classroom.getCreateTime(),
                classroom.getUpdateTime()
        );
    }
}
