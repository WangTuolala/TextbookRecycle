package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findByStudentIdOrderBySubmitTimeDesc(Long studentId);
    List<Evaluation> findByStatusOrderBySubmitTimeDesc(String status);
    List<Evaluation> findAllByOrderBySubmitTimeDesc();
}
