package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "categories")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String code;
    
    @Column(nullable = false)
    private Integer sort = 0;
    
    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE
    
    private LocalDateTime createTime = LocalDateTime.now();
}
