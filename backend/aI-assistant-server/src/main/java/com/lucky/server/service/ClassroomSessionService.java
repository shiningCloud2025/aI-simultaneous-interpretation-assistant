package com.lucky.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.lucky.server.domain.dto.ClassroomSessionStartDTO;
import com.lucky.server.domain.entity.ClassroomSession;
import com.lucky.server.domain.vo.ClassroomSessionDetailVO;

/**
 * 课堂开课记录 Service 接口
 * @author shiningCloud2025
 */
public interface ClassroomSessionService extends IService<ClassroomSession> {

    /**
     * 开始一个新课次
     *
     * 只有课堂所属老师可以开课。
     * 同一课堂允许同时存在多堂进行中或已暂停的课次。
     *
     * @param classroomId 课堂ID
     * @param dto 开课参数
     * @return 新课次详情
     */
    ClassroomSessionDetailVO startClassroomSession(
            Long classroomId,
            ClassroomSessionStartDTO dto
    );

    /**
     * 暂停课次
     *
     * 只有课堂所属老师且是本次开课老师时才可以操作。
     * 仅进行中的课次可以暂停。
     *
     * @param sessionId 课次ID
     * @return 暂停后的课次详情
     */
    ClassroomSessionDetailVO pauseClassroomSession(Long sessionId);
}
