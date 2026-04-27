package com.gluniversity.textbookrecyclesys.controller;

import com.gluniversity.textbookrecyclesys.dto.*;
import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.BookExchangeRepository;
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
    private final NotificationService notificationService;
    private final CategoryService categoryService;
    private final BookExchangeRepository bookExchangeRepository;

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

    @GetMapping("/majors")
    public ResponseEntity<ApiResponse<List<String>>> getMajors() {
        return ResponseEntity.ok(ApiResponse.success(bookService.getAllListedMajors()));
    }

    @GetMapping("/majors-status")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getMajorsWithStatus() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategories().stream()
                .map(c -> Map.of("name", c.getName() != null ? c.getName() : "", "status", c.getStatus() != null ? c.getStatus() : "ACTIVE"))
                .toList()));
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
            appointment.setAuthor(request.getAuthor());
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
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "points", points,
                "records", records
        )));
    }

    @GetMapping("/exchanges")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudentExchanges(
            @RequestHeader("X-User-Id") Long studentId) {
        List<BookExchange> bookExchanges = bookExchangeRepository.findByStudentIdOrderByExchangeTimeDesc(studentId);
        List<PrizeExchange> prizeExchanges = prizeService.getExchangesByStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "bookExchanges", bookExchanges.stream().filter(e -> "COMPLETED".equals(e.getStatus())).toList(),
                "prizeExchanges", prizeExchanges.stream().filter(e -> "COMPLETED".equals(e.getStatus())).toList()
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

    @PostMapping("/books/exchange")
    public ResponseEntity<ApiResponse<Book>> exchangeBook(
            @RequestBody Map<String, Object> request,
            @RequestHeader("X-User-Id") Long studentId) {
        try {
            Long bookId = Long.valueOf(request.get("bookId").toString());
            Integer quantity = Integer.valueOf(request.getOrDefault("quantity", 1).toString());
            Book book = bookService.exchangeBook(studentId, bookId, quantity, userService);
            return ResponseEntity.ok(ApiResponse.success("兑换成功", book));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnnouncements(
            @RequestHeader("X-User-Id") Long studentId) {
        List<Announcement> announcements = announcementService.getAllAnnouncements();
        List<Long> readIds = announcementService.getReadAnnouncementIds(studentId);
        Map<String, Object> result = Map.of(
                "announcements", announcements,
                "readIds", readIds
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/notices")
    public ResponseEntity<ApiResponse<List<Notice>>> getNotices() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getAllNotices()));
    }

    @GetMapping("/location-notice")
    public ResponseEntity<ApiResponse<LocationNotice>> getLocationNotice() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getActiveLocationNotice()));
    }

    @PostMapping("/announcements/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAnnouncementAsRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long studentId) {
        announcementService.markAnnouncementAsRead(studentId, id);
        return ResponseEntity.ok(ApiResponse.success("已读", null));
    }

    @GetMapping("/location-notice/read-ids")
    public ResponseEntity<ApiResponse<List<Long>>> getLocationNoticeReadIds(
            @RequestHeader("X-User-Id") Long studentId) {
        List<Long> readIds = announcementService.getReadLocationNoticeIds(studentId);
        return ResponseEntity.ok(ApiResponse.success(readIds));
    }

    @PostMapping("/location-notice/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markLocationNoticeAsRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long studentId) {
        announcementService.markLocationNoticeAsRead(studentId, id);
        return ResponseEntity.ok(ApiResponse.success("已读", null));
    }

    @GetMapping("/location-notice/admin")
    public ResponseEntity<ApiResponse<LocationNotice>> getAdminLocationNotice() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getActiveLocationNoticeByRole("ADMIN")));
    }

    @GetMapping("/location-notice/logistics")
    public ResponseEntity<ApiResponse<LocationNotice>> getLogisticsLocationNotice() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getActiveLocationNoticeByRole("LOGISTICS")));
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

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @RequestBody Map<String, String> request,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");
            userService.updatePassword(userId, oldPassword, newPassword);
            return ResponseEntity.ok(ApiResponse.success("密码修改成功"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(
            @RequestHeader("X-User-Id") Long studentId) {
        List<Notification> notifications = notificationService.getNotificationsByStudentId(studentId);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/notifications/unread")
    public ResponseEntity<ApiResponse<List<Notification>>> getUnreadNotifications(
            @RequestHeader("X-User-Id") Long studentId) {
        List<Notification> notifications = notificationService.getUnreadNotifications(studentId);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markNotificationAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("已读", null));
    }
}
