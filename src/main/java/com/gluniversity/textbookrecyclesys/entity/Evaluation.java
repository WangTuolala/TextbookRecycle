package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "evaluations")
public class Evaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String appointmentId;
    
    @Column(nullable = false)
    private Long studentId;
    private String studentName;
    private String studentUsername;
    
    private String bookName;
    private String author;
    private String publisher;
    private String isbn;
    private String selfCondition; // 学生自评
    private String adminCondition; // 管理员评定
    private Integer points;
    @Column(columnDefinition = "TEXT")
    private String coverImage;
    private String remark;
    
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPROVED, LISTED, DELISTED
    
    private LocalDateTime submitTime;
    private LocalDateTime evaluateTime;
}
