package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String author;
    private String publisher;
    private String isbn;
    
    @Column(nullable = false)
    private String major;
    
    @Column(name = "`condition`")
    private String condition; // 全新, 良好, 一般, 陈旧
    
    @Column(nullable = false)
    private Integer points = 0;
    
    @Column(nullable = false)
    private Integer stock = 0;
    
    @Column(columnDefinition = "TEXT")
    private String coverImage; // base64 or URL
    
    @Column(nullable = false)
    private String status = "LISTED"; // LISTED, DELISTED
    
    private LocalDateTime createTime = LocalDateTime.now();
    private LocalDateTime updateTime = LocalDateTime.now();
}
