package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.PointsRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PointsRecordRepository extends JpaRepository<PointsRecord, Long> {
    List<PointsRecord> findByUserIdOrderByCreateTimeDesc(Long userId);
}
