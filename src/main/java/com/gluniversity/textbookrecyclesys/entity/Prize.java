package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "prizes")
public class Prize {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private Integer points;
    
    @Column(nullable = false)
    private Integer stock = 0;
    
    @Column(columnDefinition = "TEXT")
    private String imageData;
    
    private LocalDateTime createTime = LocalDateTime.now();
}
