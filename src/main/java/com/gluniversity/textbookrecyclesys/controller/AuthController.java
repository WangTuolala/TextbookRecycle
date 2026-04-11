package com.gluniversity.textbookrecyclesys.controller;

import com.gluniversity.textbookrecyclesys.dto.*;
import com.gluniversity.textbookrecyclesys.entity.User;
import com.gluniversity.textbookrecyclesys.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<User>> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.login(request.getUsername(), request.getPassword());
            if (!user.getRole().equalsIgnoreCase(request.getRole())) {
                return ResponseEntity.badRequest().body(ApiResponse.error("角色不匹配"));
            }
            return ResponseEntity.ok(ApiResponse.success(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@RequestBody RegisterRequest request) {
        System.out.println("=== [AUTH] Register called ===");
        System.out.println("Username: " + request.getUsername());
        System.out.println("Role: " + request.getRole());
        try {
            User user = new User();
            user.setUsername(request.getUsername());
            user.setPassword(request.getPassword());
            user.setRole(request.getRole() != null ? request.getRole().toUpperCase() : "STUDENT");
            user.setName(request.getName());
            user.setPhone(request.getPhone());
            user.setCollege(request.getCollege());
            user.setMajor(request.getMajor());
            user.setClassName(request.getClassName());
            user.setYear(request.getYear());
            user.setEmpId(request.getEmpId());
            user.setDept(request.getDept());
            user.setPosition(request.getPosition());
            user.setWorkplace(request.getWorkplace());
            System.out.println("User object created, calling userService.register...");
            User registered = userService.register(user);
            System.out.println("User registered successfully, ID: " + registered.getId());
            return ResponseEntity.ok(ApiResponse.success("注册成功", registered));
        } catch (Exception e) {
            System.out.println("!!! Registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/check/{username}")
    public ResponseEntity<ApiResponse<Boolean>> checkUsername(@PathVariable String username) {
        boolean exists = userService.findByUsername(username).isPresent();
        return ResponseEntity.ok(ApiResponse.success(exists));
    }
}
