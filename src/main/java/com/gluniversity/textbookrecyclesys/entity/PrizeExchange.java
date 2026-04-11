package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "prize_exchanges")
public class PrizeExchange {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long studentId;
    
    private String studentName;
    
    @Column(nullable = false)
    private Long prizeId;
    
    private String prizeName;
    
    @Column(nullable = false)
    private Integer points;
    
    @Column(nullable = false)
    private Integer quantity = 1;
    
    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, COMPLETED
    
    private LocalDateTime exchangeTime = LocalDateTime.now();
    private LocalDateTime pickupTime;
}
