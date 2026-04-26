package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.AnnouncementRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, Long> {
    
    /**
     * 查询某学生对某公告的已读记录
     */
    Optional<AnnouncementRead> findByStudentIdAndAnnouncementIdAndType(
            Long studentId, Long announcementId, String type);
    
    /**
     * 查询某学生的所有已读公告ID列表
     */
    @Query("SELECT ar.announcementId FROM AnnouncementRead ar WHERE ar.studentId = :studentId AND ar.type = :type AND ar.isRead = true")
    List<Long> findReadAnnouncementIds(@Param("studentId") Long studentId, @Param("type") String type);
    
    /**
     * 标记为已读（不存在则创建，存在则更新）
     */
    @Modifying
    @Query(value = "INSERT INTO announcement_read (student_id, announcement_id, type, is_read, read_at) " +
            "VALUES (:studentId, :announcementId, :type, true, NOW()) " +
            "ON DUPLICATE KEY UPDATE is_read = true, read_at = NOW()", nativeQuery = true)
    void markAsRead(@Param("studentId") Long studentId, 
                    @Param("announcementId") Long announcementId, 
                    @Param("type") String type);
    
    /**
     * 统计某学生的未读公告数量
     */
    @Query("SELECT COUNT(ar) FROM AnnouncementRead ar WHERE ar.studentId = :studentId AND ar.type = :type AND ar.isRead = false")
    long countUnread(@Param("studentId") Long studentId, @Param("type") String type);
}