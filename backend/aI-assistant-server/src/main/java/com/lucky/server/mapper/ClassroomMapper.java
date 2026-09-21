package com.lucky.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lucky.server.common.enums.ClassroomStatusEnum;
import com.lucky.server.domain.entity.Classroom;
import com.lucky.server.domain.vo.StudentClassroomDetailVO;
import com.lucky.server.domain.vo.StudentClassroomListVO;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * 课堂 Mapper
 * @author shiningCloud2025
 */
public interface ClassroomMapper extends BaseMapper<Classroom> {

    /**
     * 分页查询指定学生加入的课堂
     *
     * @param page 分页参数
     * @param studentId 学生用户ID
     * @param keyword 课堂名称关键字
     * @param status 课堂状态
     * @return 学生课堂分页数据
     */
    @Select("""
            <script>
            SELECT
                c.id AS id,
                cm.id AS classroomMemberId,
                c.teacher_id AS teacherId,
                c.name AS name,
                c.language_code AS languageCode,
                c.stage_code AS stageCode,
                c.academic_year AS academicYear,
                c.semester_code AS semesterCode,
                c.status AS status,
                cm.student_name AS studentName,
                cm.joined_time AS joinedTime,
                c.update_time AS updateTime
            FROM classroom_member cm
            INNER JOIN classroom c
                ON c.id = cm.classroom_id
                AND c.deleted = 0
            WHERE cm.student_id = #{studentId}
                AND cm.deleted = 0
            <if test="keyword != null and keyword != ''">
                AND c.name LIKE CONCAT('%', #{keyword}, '%')
            </if>
            <if test="status != null">
                AND c.status = #{status}
            </if>
            ORDER BY cm.joined_time DESC
            </script>
            """)
    Page<StudentClassroomListVO> selectMyJoinedClassroomPage(
            Page<StudentClassroomListVO> page,
            @Param("studentId") Long studentId,
            @Param("keyword") String keyword,
            @Param("status") ClassroomStatusEnum status
    );

    /**
     * 查询指定学生加入的课堂详情
     *
     * @param classroomId 课堂ID
     * @param studentId 学生用户ID
     * @return 学生课堂详情
     */
    @Select("""
            SELECT
                c.id AS id,
                cm.id AS classroomMemberId,
                c.teacher_id AS teacherId,
                c.name AS name,
                c.language_code AS languageCode,
                c.stage_code AS stageCode,
                c.academic_year AS academicYear,
                c.semester_code AS semesterCode,
                c.description AS description,
                c.invite_code AS inviteCode,
                c.status AS status,
                cm.student_name AS studentName,
                cm.joined_time AS joinedTime,
                c.create_time AS createTime,
                c.update_time AS updateTime
            FROM classroom_member cm
            INNER JOIN classroom c
                ON c.id = cm.classroom_id
                AND c.deleted = 0
            WHERE cm.classroom_id = #{classroomId}
                AND cm.student_id = #{studentId}
                AND cm.deleted = 0
            LIMIT 1
            """)
    StudentClassroomDetailVO selectMyJoinedClassroomDetail(
            @Param("classroomId") Long classroomId,
            @Param("studentId") Long studentId
    );
}
