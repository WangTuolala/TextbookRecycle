package com.gluniversity.textbookrecyclesys.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String role;
    private String name;
    private String phone;
    private String college;
    private String major;
    private String className;
    private String year;
    private String empId;
    private String dept;
    private String position;
    private String workplace;
}
