package com.lucky.server.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.lucky.server.common.basic.BusinessException;
import com.lucky.server.common.enums.ClassroomStatusEnum;
import com.lucky.server.common.enums.DeletedStatusEnum;
import com.lucky.server.common.enums.ResultCodeEnum;
import com.lucky.server.common.enums.UserTypeEnum;
import com.lucky.server.domain.dto.ClassroomCreateDTO;
import com.lucky.server.domain.entity.Classroom;
import com.lucky.server.domain.entity.SysUser;
import com.lucky.server.domain.vo.ClassroomDetailVO;
import com.lucky.server.mapper.ClassroomMapper;
import com.lucky.server.service.ClassroomService;
import com.lucky.server.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
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
}
