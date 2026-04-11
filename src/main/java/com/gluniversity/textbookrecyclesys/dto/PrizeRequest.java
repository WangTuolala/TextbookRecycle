package com.gluniversity.textbookrecyclesys.dto;

import lombok.Data;

@Data
public class PrizeRequest {
    private String name;
    private Integer points;
    private Integer stock;
    private String imageData;
}
