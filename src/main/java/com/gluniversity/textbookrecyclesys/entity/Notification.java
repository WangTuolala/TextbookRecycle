package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long studentId;
    
    private String studentName;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    // 类型：APPOINTMENT_REJECTED（预约被拒绝）
    private String type;
    
    private Long relatedId; // 关联的预约ID
    
    private LocalDateTime createTime = LocalDateTime.now();
    
    private Boolean isRead = false;
}
