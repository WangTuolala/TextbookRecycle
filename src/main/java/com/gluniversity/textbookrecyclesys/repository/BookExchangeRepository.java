package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.BookExchange;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookExchangeRepository extends JpaRepository<BookExchange, Long> {
    List<BookExchange> findAllByOrderByExchangeTimeDesc();
    List<BookExchange> findByStudentIdOrderByExchangeTimeDesc(Long studentId);
}
