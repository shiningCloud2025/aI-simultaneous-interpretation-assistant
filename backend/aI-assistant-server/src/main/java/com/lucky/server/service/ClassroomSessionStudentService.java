package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.entity.ClassroomSessionStudent;

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
}
