package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "points_records")
public class PointsRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    private String userName;
    
    @Column(nullable = false)
    private String type; // RECYCLE, EXCHANGE
    
    @Column(nullable = false)
    private Integer points; // 正数增加，负数减少
    
    @Column(nullable = false)
    private Integer balance;
    
    private String description;
    
    @Column(nullable = false)
    private String category; // BOOK, PRIZE
    
    private LocalDateTime createTime = LocalDateTime.now();
}
