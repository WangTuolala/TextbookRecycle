package com.gluniversity.textbookrecyclesys.dto;

import lombok.Data;

@Data
public class PointsRuleRequest {
    private Integer newPoints;
    private Integer goodPoints;
    private Integer normalPoints;
    private Integer oldPoints;
    private Integer prizeMax;
}
