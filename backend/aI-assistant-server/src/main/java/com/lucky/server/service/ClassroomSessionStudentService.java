package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.ClassroomSessionStudentPageQueryDTO;
import com.lucky.server.domain.entity.ClassroomSessionStudent;
import com.lucky.server.domain.vo.ClassroomSessionStudentDetailVO;
import com.lucky.server.domain.vo.ClassroomSessionStudentListVO;

/**
 * 课堂课次学生记录 Service 接口
 *
 * @author shiningCloud2025
 */
public interface ClassroomSessionStudentService
        extends IService<ClassroomSessionStudent> {

    /**
     * 创建课次学生记录
     *
     * 开始课次时，将课堂当前全部成员保存为课次学生快照，
     * 学生初始签到状态统一为缺席。
     *
     * 该方法由开课业务调用，不单独提供接口。
     *
     * @param classroomId 课堂ID
     * @param classroomSessionId 课次ID
     */
    void createClassroomSessionStudents(
            Long classroomId,
            Long classroomSessionId
    );

    /**
     * 学生签到
     *
     * 只有本次课次学生名单中的学生可以签到。
     * 仅进行中的课次允许签到。
     * 已完成签到时重复调用，直接返回原签到记录。
     *
     * @param classroomSessionId 课次ID
     * @return 签到后的课次学生记录
     */
    ClassroomSessionStudentDetailVO checkIn(
            Long classroomSessionId
    );

    /**
     * 获取课次学生记录详情
     *
     * 本次开课老师和本次课次名单中的学生可以查看。
     *
     * @param classroomSessionStudentId 课次学生记录ID
     * @return 课次学生记录详情
     */
    ClassroomSessionStudentDetailVO
            getClassroomSessionStudentDetail(
                    Long classroomSessionStudentId
            );

    /**
     * 分页查询课次学生记录
     *
     * 本次开课老师和本次课次名单中的学生可以查看。
     * 支持按学生姓名和签到状态筛选。
     *
     * @param classroomSessionId 课次ID
     * @param dto 分页查询参数
     * @return 课次学生记录分页数据
     */
    Page<ClassroomSessionStudentListVO>
            pageClassroomSessionStudents(
                    Long classroomSessionId,
                    ClassroomSessionStudentPageQueryDTO dto
            );
}
