package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.ClassroomCreateDTO;
import com.lucky.server.domain.dto.ClassroomJoinDTO;
import com.lucky.server.domain.dto.ClassroomPageQueryDTO;
import com.lucky.server.domain.dto.ClassroomUpdateDTO;
import com.lucky.server.domain.dto.StudentClassroomPageQueryDTO;
import com.lucky.server.domain.entity.Classroom;
import com.lucky.server.domain.vo.ClassroomDetailVO;
import com.lucky.server.domain.vo.ClassroomInviteVO;
import com.lucky.server.domain.vo.ClassroomListVO;
import com.lucky.server.domain.vo.StudentClassroomDetailVO;
import com.lucky.server.domain.vo.StudentClassroomListVO;

/**
 * 课堂 Service 接口
 * @author shiningCloud2025
 */
public interface ClassroomService extends IService<Classroom> {

    /**
     * 创建课堂
     *
     * @param dto 创建课堂参数
     * @return 课堂详情
     */
    ClassroomDetailVO createClassroom(ClassroomCreateDTO dto);

    /**
     * 修改课堂基本资料
     *
     * 仅允许修改课堂名称和课堂说明。
     *
     * @param classroomId 课堂ID
     * @param dto 修改课堂参数
     * @return 修改后的课堂详情
     */
    ClassroomDetailVO updateClassroom(Long classroomId, ClassroomUpdateDTO dto);

    /**
     * 刷新课堂邀请码
     *
     * 刷新后原邀请码立即失效。
     *
     * @param classroomId 课堂ID
     * @return 新的邀请码信息
     */
    ClassroomInviteVO refreshInviteCode(Long classroomId);

    /**
     * 归档课堂
     *
     * 归档后不能继续开课、添加成员或修改课堂资料，
     * 但可以查看历史成员、课次和出勤记录。
     *
     * @param classroomId 课堂ID
     */
    void archiveClassroom(Long classroomId);

    /**
     * 获取当前老师的课堂详情
     *
     * @param classroomId 课堂ID
     * @return 课堂详情
     */
    ClassroomDetailVO getMyClassroomDetail(Long classroomId);

    /**
     * 分页查询当前老师的课堂
     *
     * @param dto 分页查询参数
     * @return 课堂分页数据
     */
    Page<ClassroomListVO> pageMyClassrooms(
            ClassroomPageQueryDTO dto
    );

    /**
     * 使用邀请码加入课堂
     *
     * @param dto 加入课堂参数
     * @return 加入后的课堂详情
     */
    ClassroomDetailVO joinClassroom(ClassroomJoinDTO dto);

    /**
     * 分页查询当前学生加入的课堂
     *
     * @param dto 分页查询参数
     * @return 学生课堂分页数据
     */
    Page<StudentClassroomListVO> pageMyJoinedClassrooms(
            StudentClassroomPageQueryDTO dto
    );

    /**
     * 获取当前学生加入的课堂详情
     *
     * @param classroomId 课堂ID
     * @return 学生课堂详情
     */
    StudentClassroomDetailVO getMyJoinedClassroomDetail(
            Long classroomId
    );

    /**
     * 根据邀请码查询正常状态的课堂
     *
     * 该方法主要供学生加入课堂业务调用。
     *
     * @param inviteCode 课堂邀请码
     * @return 课堂实体
     */
    Classroom getNormalClassroomByInviteCode(String inviteCode);
}
