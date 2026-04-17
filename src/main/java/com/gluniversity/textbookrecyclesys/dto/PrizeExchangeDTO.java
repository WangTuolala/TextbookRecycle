package com.gluniversity.textbookrecyclesys.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PrizeExchangeDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long prizeId;
    private String prizeName;
    private String prizeImageData;
    private Integer points;
    private Integer quantity;
    private String status;
    private LocalDateTime exchangeTime;
    private LocalDateTime pickupTime;
}
