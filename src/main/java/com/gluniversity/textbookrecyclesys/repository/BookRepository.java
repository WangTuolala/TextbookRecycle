package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByStatus(String status);
    List<Book> findByMajor(String major);
    List<Book> findByStatusAndMajor(String status, String major);
}
