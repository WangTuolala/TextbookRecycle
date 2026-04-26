package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "book_exchanges")
public class BookExchange {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private String studentName;

    @Column(nullable = false)
    private Long bookId;

    @Column(nullable = false)
    private String bookName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer pointsCost;

    private LocalDateTime exchangeTime = LocalDateTime.now();

    private String status = "PENDING"; // PENDING, COMPLETED

    @Column(columnDefinition = "TEXT")
    private String coverImage; // 教材封面图
}
