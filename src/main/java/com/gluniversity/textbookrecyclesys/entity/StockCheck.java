package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "stock_checks")
public class StockCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bookId;
    private String bookName;
    private String isbn;
    private Integer systemStock; // 全部库存
    private Integer actualStock; // 实际盘点
    private Integer diff;       // 差异 = 实际-系统
    private String remark;       // 正常/多/少
    private String operator;     // 经手人
    private LocalDateTime checkTime = LocalDateTime.now();
}
