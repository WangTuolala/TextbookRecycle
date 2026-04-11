package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String role; // STUDENT, ADMIN, LOGISTICS
    
    private String name;
    private String phone;
    private String college;
    private String major;
    private String className;
    @Column(name = "entry_year")
    private String year;
    
    // For admin/logistics
    private String empId;
    private String dept;
    private String position;
    private String workplace;
    
    @Column(columnDefinition = "INT DEFAULT 0")
    private Integer points = 0;
    
    private LocalDateTime createTime = LocalDateTime.now();
}
