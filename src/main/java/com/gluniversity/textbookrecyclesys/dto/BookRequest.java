package com.gluniversity.textbookrecyclesys.dto;

import lombok.Data;

@Data
public class BookRequest {
    private String name;
    private String author;
    private String publisher;
    private String isbn;
    private String major;
    private Integer points;
    private Integer stock;
    private String coverImage;
}
