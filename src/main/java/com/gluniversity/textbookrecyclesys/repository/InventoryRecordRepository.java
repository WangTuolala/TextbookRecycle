package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.InventoryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryRecordRepository extends JpaRepository<InventoryRecord, Long> {
    List<InventoryRecord> findByBookIdOrderByCreateTimeDesc(Long bookId);
    List<InventoryRecord> findAllByOrderByCreateTimeDesc();
}
