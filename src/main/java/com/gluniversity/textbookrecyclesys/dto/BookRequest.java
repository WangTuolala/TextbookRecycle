package com.gluniversity.textbookrecyclesys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookRequest {
    private String name;
    private String author;
    private String publisher;
    private String isbn;
    private String major;
    private String condition;
    private Integer points;
    private Integer stock;
    private String status;
    private String coverImage;
    private MultipartFile coverImageFile;
}
