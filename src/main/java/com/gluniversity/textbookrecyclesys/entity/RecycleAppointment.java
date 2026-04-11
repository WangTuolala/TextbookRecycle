package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "recycle_appointments")
public class RecycleAppointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String appointmentId; // AP-YYYYMMDD-XXX
    
    @Column(nullable = false)
    private Long studentId;
    
    private String studentName;
    private String studentUsername;
    
    @Column(nullable = false)
    private String bookName;
    
    private String isbn;
    private String publisher;
    @Column(name = "`condition`")
    private String condition; // 学生自评
    private Integer quantity = 1;
    private String remark;
    @Column(columnDefinition = "LONGTEXT")
    private String coverImage;
    
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, COMPLETED
    
    private LocalDateTime submitTime = LocalDateTime.now();
}
