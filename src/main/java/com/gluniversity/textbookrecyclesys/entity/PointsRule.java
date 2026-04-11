package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "points_rules")
public class PointsRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Integer ruleNew = 200;
    
    @Column(nullable = false)
    private Integer ruleGood = 150;
    
    @Column(nullable = false)
    private Integer ruleNormal = 80;
    
    @Column(nullable = false)
    private Integer ruleOld = 40;
    
    @Column(nullable = false)
    private Integer prizeMax = 500;
}
