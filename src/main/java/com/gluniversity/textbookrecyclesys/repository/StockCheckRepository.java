package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.StockCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockCheckRepository extends JpaRepository<StockCheck, Long> {
    List<StockCheck> findAllByOrderByCheckTimeDesc();
}
