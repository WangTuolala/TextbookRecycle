package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.RecycleAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecycleAppointmentRepository extends JpaRepository<RecycleAppointment, Long> {
    List<RecycleAppointment> findByStudentIdOrderBySubmitTimeDesc(Long studentId);
    List<RecycleAppointment> findByStatusOrderBySubmitTimeDesc(String status);
    List<RecycleAppointment> findAllByOrderBySubmitTimeDesc();
}
