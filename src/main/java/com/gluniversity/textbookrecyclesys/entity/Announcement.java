package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "announcements")
public class Announcement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Column(nullable = false)
    private String publisher;
    
    @Column(nullable = false)
    private String publisherRole; // ADMIN, LOGISTICS
    
    private LocalDateTime publishTime = LocalDateTime.now();
}
