package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findByStudentIdOrderBySubmitTimeDesc(Long studentId);
    List<Evaluation> findByStatusOrderBySubmitTimeDesc(String status);
    List<Evaluation> findAllByOrderBySubmitTimeDesc();
    
    @Query("SELECT e FROM Evaluation e WHERE " +
           "e.studentUsername LIKE CONCAT('%', :keyword, '%') OR " +
           "e.studentName LIKE CONCAT('%', :keyword, '%') OR " +
           "e.appointmentId LIKE CONCAT('%', :keyword, '%') OR " +
           "e.bookName LIKE CONCAT('%', :keyword, '%') " +
           "ORDER BY e.submitTime DESC")
    List<Evaluation> searchEvaluations(@Param("keyword") String keyword);
}
