package com.gluniversity.textbookrecyclesys.dto;

import lombok.Data;

@Data
public class AppointmentRequest {
    private String bookName;
    private String isbn;
    private String publisher;
    private String condition;
    private Integer quantity;
    private String remark;
    private String coverImage;
}
