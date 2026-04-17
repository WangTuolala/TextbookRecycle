package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "location_notices")
public class LocationNotice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String location;
    
    @Column(columnDefinition = "TEXT")
    private String notice;
    
    @Column(nullable = false)
    private String publisher;
    
    @Column(nullable = false)
    private String publisherRole; // ADMIN 或 LOGISTICS
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    private LocalDateTime publishTime = LocalDateTime.now();
}
