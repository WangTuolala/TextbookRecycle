package com.gluniversity.textbookrecyclesys.controller;

import com.gluniversity.textbookrecyclesys.dto.*;
import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {
    private final UserService userService;
    private final BookService bookService;
    private final RecycleService recycleService;
    private final PrizeService prizeService;
    private final AnnouncementService announcementService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@RequestBody RegisterRequest request) {
        try {
            User user = new User();
            user.setUsername(request.getUsername());
            user.setPassword(request.getPassword());
            user.setRole(request.getRole());
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
            User registered = userService.register(user);
            return ResponseEntity.ok(ApiResponse.success("注册成功", registered));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

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

    @GetMapping("/books")
    public ResponseEntity<ApiResponse<List<Book>>> getBooks(
            @RequestParam(required = false) String major,
            @RequestParam(required = false) String keyword) {
        List<Book> books;
        if (keyword != null && !keyword.isEmpty()) {
            books = bookService.searchBooks(keyword);
        } else if (major != null && !major.equals("all")) {
            books = bookService.getBooksByMajor(major);
        } else {
            books = bookService.getAllBooks();
        }
        return ResponseEntity.ok(ApiResponse.success(books));
    }

    @GetMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Book>> getBook(@PathVariable Long id) {
        return bookService.getBookById(id)
                .map(book -> ResponseEntity.ok(ApiResponse.success(book)))
                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("书籍不存在")));
    }

    @PostMapping("/appointments")
    public ResponseEntity<ApiResponse<RecycleAppointment>> submitAppointment(
            @RequestBody AppointmentRequest request,
            @RequestHeader("X-User-Id") Long studentId) {
        try {
            RecycleAppointment appointment = new RecycleAppointment();
            appointment.setBookName(request.getBookName());
            appointment.setIsbn(request.getIsbn());
            appointment.setPublisher(request.getPublisher());
            appointment.setCondition(request.getCondition());
            appointment.setQuantity(request.getQuantity());
            appointment.setRemark(request.getRemark());
            appointment.setCoverImage(request.getCoverImage());
            RecycleAppointment saved = recycleService.submitAppointment(appointment, studentId);
            return ResponseEntity.ok(ApiResponse.success("预约提交成功", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<List<RecycleAppointment>>> getMyAppointments(
            @RequestHeader("X-User-Id") Long studentId) {
        List<RecycleAppointment> appointments = recycleService.getAppointmentsByStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    @GetMapping("/points")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPointsInfo(
            @RequestHeader("X-User-Id") Long studentId) {
        Integer points = userService.getPoints(studentId);
        List<PointsRecord> records = userService.getPointsRecords(studentId);
        List<Evaluation> evaluations = recycleService.getEvaluationsByStudent(studentId);
        List<PrizeExchange> exchanges = prizeService.getExchangesByStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "points", points,
                "records", records,
                "recycles", evaluations,
                "exchanges", exchanges
        )));
    }

    @GetMapping("/prizes")
    public ResponseEntity<ApiResponse<List<Prize>>> getPrizes() {
        return ResponseEntity.ok(ApiResponse.success(prizeService.getAllPrizes()));
    }

    @PostMapping("/prizes/exchange")
    public ResponseEntity<ApiResponse<PrizeExchange>> exchangePrize(
            @RequestBody Map<String, Object> request,
            @RequestHeader("X-User-Id") Long studentId) {
        try {
            Long prizeId = Long.valueOf(request.get("prizeId").toString());
            Integer quantity = Integer.valueOf(request.getOrDefault("quantity", 1).toString());
            PrizeExchange exchange = prizeService.exchangePrize(studentId, prizeId, quantity);
            return ResponseEntity.ok(ApiResponse.success("兑换成功", exchange));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<List<Announcement>>> getAnnouncements() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getAllAnnouncements()));
    }

    @GetMapping("/notices")
    public ResponseEntity<ApiResponse<List<Notice>>> getNotices() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getAllNotices()));
    }

    @GetMapping("/location-notice")
    public ResponseEntity<ApiResponse<LocationNotice>> getLocationNotice() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getActiveLocationNotice()));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<User>> getProfile(@RequestHeader("X-User-Id") Long userId) {
        return userService.findById(userId)
                .map(u -> ResponseEntity.ok(ApiResponse.success(u)))
                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("用户不存在")));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(
            @RequestBody User updatedUser,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            User user = userService.updateProfile(userId, updatedUser);
            return ResponseEntity.ok(ApiResponse.success("更新成功", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
