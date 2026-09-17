package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.common.enums.ClassroomMemberJoinTypeEnum;
import com.lucky.server.domain.dto.ClassroomMemberPageQueryDTO;
import com.lucky.server.domain.dto.ClassroomMemberUpdateDTO;
import com.lucky.server.domain.entity.ClassroomMember;
import com.lucky.server.domain.vo.ClassroomMemberDetailVO;
import com.lucky.server.domain.vo.ClassroomMemberListVO;

/**
 * 课堂成员 Service 接口
 * @author shiningCloud2025
 */
public interface ClassroomMemberService extends IService<ClassroomMember> {

    /**
     * 添加课堂成员
     *
     * 该方法由加入课堂等业务调用，不表示完整的加入课堂流程。
     *
     * @param classroomId 课堂ID
     * @param studentId 学生用户ID
     * @param studentName 学生在课堂中的真实姓名
     * @param joinType 加入方式
     * @return 课堂成员实体
     */
    ClassroomMember addClassroomMember(
            Long classroomId,
            Long studentId,
            String studentName,
            ClassroomMemberJoinTypeEnum joinType
    );

    /**
     * 学生修改自己在课堂中的真实姓名
     *
     * @param classroomMemberId 课堂成员ID
     * @param dto 修改参数
     * @return 修改后的课堂成员详情
     */
    ClassroomMemberDetailVO updateMyClassroomMember(
            Long classroomMemberId,
            ClassroomMemberUpdateDTO dto
    );

    /**
     * 老师修改课堂成员的真实姓名
     *
     * @param classroomMemberId 课堂成员ID
     * @param dto 修改参数
     * @return 修改后的课堂成员详情
     */
    ClassroomMemberDetailVO updateClassroomMember(
            Long classroomMemberId,
            ClassroomMemberUpdateDTO dto
    );

    /**
     * 老师移除课堂成员
     *
     * @param classroomMemberId 课堂成员ID
     */
    void removeClassroomMember(Long classroomMemberId);

    /**
     * 获取课堂成员详情
     *
     * @param classroomMemberId 课堂成员ID
     * @return 课堂成员详情
     */
    ClassroomMemberDetailVO getClassroomMemberDetail(
            Long classroomMemberId
    );

    /**
     * 分页查询指定课堂的成员
     *
     * @param classroomId 课堂ID
     * @param dto 分页查询参数
     * @return 课堂成员分页数据
     */
    Page<ClassroomMemberListVO> pageClassroomMembers(
            Long classroomId,
            ClassroomMemberPageQueryDTO dto
    );
}
