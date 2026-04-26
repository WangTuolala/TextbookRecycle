package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_records")
public class InventoryRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long bookId;
    
    private String bookName;

    private String isbn;

    @Column(nullable = false)
    private String type; // IN, OUT
    
    @Column(nullable = false)
    private Integer quantity;
    
    private String operator; // 后勤人员
    private String remark;
    
    private LocalDateTime createTime = LocalDateTime.now();
}
