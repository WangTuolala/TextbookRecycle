package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.RecycleAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface RecycleAppointmentRepository extends JpaRepository<RecycleAppointment, Long> {
    List<RecycleAppointment> findByStudentIdOrderBySubmitTimeDesc(Long studentId);
    List<RecycleAppointment> findByStatusOrderBySubmitTimeDesc(String status);
    List<RecycleAppointment> findAllByOrderBySubmitTimeDesc();
    
    @Query("SELECT a FROM RecycleAppointment a WHERE " +
           "a.studentUsername LIKE CONCAT('%', :keyword, '%') OR " +
           "a.studentName LIKE CONCAT('%', :keyword, '%') OR " +
           "a.appointmentId LIKE CONCAT('%', :keyword, '%') OR " +
           "a.bookName LIKE CONCAT('%', :keyword, '%') " +
           "ORDER BY a.submitTime DESC")
    List<RecycleAppointment> searchAppointments(@Param("keyword") String keyword);
}
