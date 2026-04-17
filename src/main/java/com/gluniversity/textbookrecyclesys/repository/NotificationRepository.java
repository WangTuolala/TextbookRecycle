package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByStudentIdOrderByCreateTimeDesc(Long studentId);
    List<Notification> findByStudentIdAndIsReadOrderByCreateTimeDesc(Long studentId, Boolean isRead);
}
