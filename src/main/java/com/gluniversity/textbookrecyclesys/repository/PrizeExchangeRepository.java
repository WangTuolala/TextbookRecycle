package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.PrizeExchange;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrizeExchangeRepository extends JpaRepository<PrizeExchange, Long> {
    List<PrizeExchange> findByStudentIdOrderByExchangeTimeDesc(Long studentId);
}
