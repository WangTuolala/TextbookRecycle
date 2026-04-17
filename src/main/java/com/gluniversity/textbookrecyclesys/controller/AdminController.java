package com.gluniversity.textbookrecyclesys.controller;

import com.gluniversity.textbookrecyclesys.dto.*;
import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.*;
import com.gluniversity.textbookrecyclesys.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final BookService bookService;
    private final CategoryService categoryService;
    private final RecycleService recycleService;
    private final PrizeService prizeService;
    private final AnnouncementService announcementService;
    private final InventoryService inventoryService;
    private final UserService userService;
    private final PrizeRepository prizeRepository;
    private final BookExchangeRepository bookExchangeRepository;

    // ===== 数据统计 =====
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        int totalRecycled = recycleService.getAllEvaluations().size();
        int totalExchanged = prizeService.getAllExchanges().stream().filter(e -> "COMPLETED".equals(e.getStatus())).toList().size();
        int pendingAppointments = recycleService.getAppointmentsByStatus("PENDING").size();
        int approvedAppointments = recycleService.getAppointmentsByStatus("APPROVED").size();
        int pendingEvaluations = recycleService.getEvaluationsByStatus("APPROVED").size();
        int completedEvaluations = recycleService.getEvaluationsByStatus("SYNCED").size() + recycleService.getEvaluationsByStatus("LISTED").size();
        List<Book> lowStockBooks = inventoryService.getLowStockBooks();
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "totalRecycled", totalRecycled,
                "totalExchanged", totalExchanged,
                "pendingAppointments", pendingAppointments,
                "approvedAppointments", approvedAppointments,
                "pendingEvaluations", pendingEvaluations,
                "completedEvaluations", completedEvaluations,
                "lowStockBooks", lowStockBooks
        )));
    }

    @GetMapping("/stats/charts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChartStats() {
        Map<String, Object> chartData = recycleService.getChartStats();
        return ResponseEntity.ok(ApiResponse.success(chartData));
    }

    // ===== 个人信息 =====
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<User>> getProfile(@RequestHeader(value = "X-User-Id", required = false) Long userId) {
        if (userId != null) {
            return userService.findById(userId)
                    .map(u -> ResponseEntity.ok(ApiResponse.success(u)))
                    .orElse(ResponseEntity.ok(ApiResponse.success(null)));
        }
        // 没有header时返回null，让前端自行处理
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ===== 教材兑换领取 =====
    @GetMapping("/book-exchanges")
    public ResponseEntity<ApiResponse<List<BookExchange>>> getBookExchanges() {
        List<BookExchange> exchanges = bookExchangeRepository.findAllByOrderByExchangeTimeDesc();
        return ResponseEntity.ok(ApiResponse.success(exchanges));
    }

    @PutMapping("/book-exchanges/{id}/confirm")
    public ResponseEntity<ApiResponse<String>> confirmBookPickup(@PathVariable Long id) {
        return bookExchangeRepository.findById(id)
                .map(ex -> {
                    ex.setStatus("COMPLETED");
                    bookExchangeRepository.save(ex);
                    return ResponseEntity.ok(ApiResponse.success("领取确认成功"));
                })
                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("记录不存在")));
    }

    // ===== 用户查询 =====
    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        return userService.findById(id)
                .map(u -> ResponseEntity.ok(ApiResponse.success(u)))
                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("用户不存在")));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        try {
            User user = userService.updateProfile(id, updatedUser);
            return ResponseEntity.ok(ApiResponse.success(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== 书籍管理 =====
    @GetMapping("/books")
    public ResponseEntity<ApiResponse<List<Book>>> getAllBooks() {
        return ResponseEntity.ok(ApiResponse.success(bookService.getAllBooks()));
    }

    @PostMapping("/books")
    public ResponseEntity<ApiResponse<Book>> addBook(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "author", required = false) String author,
            @RequestParam(value = "publisher", required = false) String publisher,
            @RequestParam(value = "isbn", required = false) String isbn,
            @RequestParam(value = "major", required = false) String major,
            @RequestParam(value = "condition", required = false) String condition,
            @RequestParam(value = "points", required = false) Integer points,
            @RequestParam(value = "stock", required = false) Integer stock,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        try {
            Book book = new Book();
            book.setName(name);
            book.setAuthor(author);
            book.setPublisher(publisher);
            book.setIsbn(isbn);
            book.setMajor(major);
            book.setCondition(condition);
            book.setPoints(points != null ? points : 0);
            book.setStock(stock != null ? stock : 0);
            Book saved = bookService.addBookWithImage(book, coverImageFile);
            return ResponseEntity.ok(ApiResponse.success("添加成功", saved));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("封面上传失败: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Book>> updateBook(
            @PathVariable Long id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "author", required = false) String author,
            @RequestParam(value = "publisher", required = false) String publisher,
            @RequestParam(value = "isbn", required = false) String isbn,
            @RequestParam(value = "major", required = false) String major,
            @RequestParam(value = "condition", required = false) String condition,
            @RequestParam(value = "points", required = false) Integer points,
            @RequestParam(value = "stock", required = false) Integer stock,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        try {
            Book book = new Book();
            book.setName(name);
            book.setAuthor(author);
            book.setPublisher(publisher);
            book.setIsbn(isbn);
            book.setMajor(major);
            book.setCondition(condition);
            book.setPoints(points != null ? points : 0);
            book.setStock(stock != null ? stock : 0);
            book.setStatus(status != null ? status : "LISTED");
            Book updated = bookService.updateBookWithImage(id, book, coverImageFile);
            return ResponseEntity.ok(ApiResponse.success("更新成功", updated));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("封面上传失败: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBook(@PathVariable Long id) {
        try {
            bookService.deleteBook(id);
            return ResponseEntity.ok(ApiResponse.success("删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/books/{id}/status")
    public ResponseEntity<ApiResponse<Book>> toggleBookStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            Book updated = bookService.updateBookStatus(id, status);
            return ResponseEntity.ok(ApiResponse.success("状态已更新", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== 分类管理 =====
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategories()));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<Category>> addCategory(@RequestBody Category category) {
        try {
            Category saved = categoryService.addCategory(category);
            return ResponseEntity.ok(ApiResponse.success("添加成功", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Category>> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        try {
            Category updated = categoryService.updateCategory(id, category);
            return ResponseEntity.ok(ApiResponse.success("更新成功", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(ApiResponse.success("删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== 回收审核 =====
    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<List<RecycleAppointment>>> getAppointments(
            @RequestParam(required = false) String status) {
        List<RecycleAppointment> appointments;
        if (status != null && !status.isEmpty() && !status.equals("all")) {
            appointments = recycleService.getAppointmentsByStatus(status);
        } else {
            appointments = recycleService.getAllAppointments();
        }
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    @GetMapping("/appointments/search")
    public ResponseEntity<ApiResponse<List<RecycleAppointment>>> searchAppointments(
            @RequestParam String keyword) {
        List<RecycleAppointment> appointments = recycleService.searchAppointments(keyword);
        return ResponseEntity.ok(ApiResponse.success(appointments));
    }

    @GetMapping("/evaluations/search")
    public ResponseEntity<ApiResponse<List<Evaluation>>> searchEvaluations(
            @RequestParam String keyword) {
        List<Evaluation> evaluations = recycleService.searchEvaluations(keyword);
        return ResponseEntity.ok(ApiResponse.success(evaluations));
    }

    @PostMapping("/appointments/{id}/approve")
    public ResponseEntity<ApiResponse<Evaluation>> approveAppointmentRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> request) {
        try {
            String adminCondition = (request != null && request.get("adminCondition") != null)
                    ? request.get("adminCondition") : "良好";
            Evaluation evaluation = recycleService.approveAppointment(id, adminCondition, "管理员");
            return ResponseEntity.ok(ApiResponse.success(evaluation));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/appointments/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectAppointmentRequest(@PathVariable Long id) {
        try {
            recycleService.rejectAppointment(id);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/evaluations")
    public ResponseEntity<ApiResponse<List<Evaluation>>> getEvaluations(
            @RequestParam(required = false) String status) {
        List<Evaluation> evaluations;
        if (status != null && !status.isEmpty() && !status.equals("all")) {
            evaluations = recycleService.getEvaluationsByStatus(status);
        } else {
            evaluations = recycleService.getAllEvaluations();
        }
        return ResponseEntity.ok(ApiResponse.success(evaluations));
    }

    @PostMapping("/evaluations/{id}/approve")
    public ResponseEntity<ApiResponse<Evaluation>> approveAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String adminCondition = request.get("adminCondition");
            Evaluation evaluation = recycleService.approveAppointment(id, adminCondition, "admin");
            return ResponseEntity.ok(ApiResponse.success("审核通过", evaluation));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/evaluations/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectAppointment(@PathVariable Long id) {
        try {
            recycleService.rejectAppointment(id);
            return ResponseEntity.ok(ApiResponse.success("已拒绝", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/evaluations/{id}/sync")
    public ResponseEntity<ApiResponse<Void>> syncPoints(@PathVariable Long id) {
        try {
            recycleService.syncPointsToStudent(id);
            return ResponseEntity.ok(ApiResponse.success("积分已同步", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/evaluations/{id}/list")
    public ResponseEntity<ApiResponse<Book>> listBook(@PathVariable Long id) {
        try {
            Book book = recycleService.listBook(id, "admin");
            return ResponseEntity.ok(ApiResponse.success("已上架到书籍库", book));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/evaluations/{id}/delist")
    public ResponseEntity<ApiResponse<Void>> delistBook(@PathVariable Long id) {
        try {
            recycleService.delistBook(id);
            return ResponseEntity.ok(ApiResponse.success("已下架", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== 积分规则 =====
    @GetMapping("/points-rule")
    public ResponseEntity<ApiResponse<PointsRule>> getPointsRule() {
        return ResponseEntity.ok(ApiResponse.success(prizeService.getPointsRule()));
    }

    @PutMapping("/points-rule")
    public ResponseEntity<ApiResponse<PointsRule>> updatePointsRule(@RequestBody PointsRuleRequest request) {
        try {
            PointsRule updated = prizeService.updatePointsRule(
                    request.getNewPoints(),
                    request.getGoodPoints(),
                    request.getNormalPoints(),
                    request.getOldPoints(),
                    request.getPrizeMax()
            );
            return ResponseEntity.ok(ApiResponse.success("规则已更新", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== 公告管理 =====
    @GetMapping("/announcements")
    public ResponseEntity<ApiResponse<List<Announcement>>> getAnnouncements() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getAllAnnouncements()));
    }

    @PostMapping("/announcements")
    public ResponseEntity<ApiResponse<Announcement>> publishAnnouncement(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-Operator-Name", required = false) String operatorName) {
        try {
            String operator = (operatorName != null && !operatorName.isEmpty()) ? operatorName : "管理员";
            Announcement announcement = announcementService.publishAnnouncement(
                    request.get("title"),
                    request.get("content"),
                    operator,
                    "ADMIN"
            );
            return ResponseEntity.ok(ApiResponse.success("发布成功", announcement));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/announcements/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(@PathVariable Long id) {
        try {
            announcementService.deleteAnnouncement(id);
            return ResponseEntity.ok(ApiResponse.success("删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== 地点公告 =====
    @GetMapping("/location-notices")
    public ResponseEntity<ApiResponse<List<LocationNotice>>> getLocationNotices(
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getLocationNotices(role)));
    }

    @GetMapping("/location-notice/active")
    public ResponseEntity<ApiResponse<LocationNotice>> getActiveLocationNotice() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getActiveLocationNotice()));
    }

    @PostMapping("/location-notices")
    public ResponseEntity<ApiResponse<LocationNotice>> publishLocationNotice(
            @RequestBody Map<String, String> request,
            @RequestHeader(value = "X-Operator-Name", required = false) String operatorName) {
        try {
            String operator = (operatorName != null && !operatorName.isEmpty()) ? operatorName : "管理员";
            LocationNotice notice = announcementService.publishLocationNotice(
                    request.get("location"),
                    request.get("notice"),
                    operator,
                    "ADMIN"
            );
            return ResponseEntity.ok(ApiResponse.success("发布成功", notice));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/location-notices/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLocationNotice(@PathVariable Long id) {
        try {
            announcementService.deleteLocationNotice(id);
            return ResponseEntity.ok(ApiResponse.success("删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== 库存管理 =====
    @GetMapping("/inventory/books")
    public ResponseEntity<ApiResponse<List<Book>>> getInventoryBooks() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllBooksForInventory()));
    }

    @GetMapping("/inventory/low-stock")
    public ResponseEntity<ApiResponse<List<Book>>> getLowStockBooks() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStockBooks()));
    }

    @PostMapping("/inventory/in")
    public ResponseEntity<ApiResponse<Void>> bookIn(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-Operator-Name", required = false) String operatorName) {
        try {
            Long bookId = Long.valueOf(request.get("bookId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String remark = (String) request.getOrDefault("remark", "");
            String operator = (operatorName != null && !operatorName.isEmpty()) ? operatorName : "管理员";
            inventoryService.bookIn(bookId, quantity, operator, remark);
            return ResponseEntity.ok(ApiResponse.success("入库成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/inventory/out")
    public ResponseEntity<ApiResponse<Void>> bookOut(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-Operator-Name", required = false) String operatorName) {
        try {
            Long bookId = Long.valueOf(request.get("bookId").toString());
            Integer quantity = Integer.valueOf(request.get("quantity").toString());
            String remark = (String) request.getOrDefault("remark", "");
            String operator = (operatorName != null && !operatorName.isEmpty()) ? operatorName : "管理员";
            inventoryService.bookOut(bookId, quantity, operator, remark);
            return ResponseEntity.ok(ApiResponse.success("出库成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/inventory/records")
    public ResponseEntity<ApiResponse<List<InventoryRecord>>> getInventoryRecords(
            @RequestParam(required = false) Long bookId) {
        if (bookId != null) {
            return ResponseEntity.ok(ApiResponse.success(inventoryService.getRecordsByBook(bookId)));
        }
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllRecords()));
    }

    // ===== 领取管理 =====
    @GetMapping("/prize-exchanges")
    public ResponseEntity<ApiResponse<List<PrizeExchangeDTO>>> getPrizeExchanges() {
        List<PrizeExchange> exchanges = prizeService.getAllExchanges();
        List<PrizeExchangeDTO> dtos = exchanges.stream().map(ex -> {
            PrizeExchangeDTO dto = new PrizeExchangeDTO();
            dto.setId(ex.getId());
            dto.setStudentId(ex.getStudentId());
            dto.setStudentName(ex.getStudentName());
            dto.setPrizeId(ex.getPrizeId());
            dto.setPrizeName(ex.getPrizeName());
            dto.setPoints(ex.getPoints());
            dto.setQuantity(ex.getQuantity());
            dto.setStatus(ex.getStatus());
            dto.setExchangeTime(ex.getExchangeTime());
            dto.setPickupTime(ex.getPickupTime());
            // 填充奖品图片
            if (ex.getPrizeId() != null) {
                prizeRepository.findById(ex.getPrizeId())
                        .ifPresent(prize -> dto.setPrizeImageData(prize.getImageData()));
            }
            return dto;
        }).toList();
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/prize-exchanges/{id}/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmPrizePickup(@PathVariable Long id) {
        try {
            prizeService.confirmPickup(id);
            return ResponseEntity.ok(ApiResponse.success("领取确认成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
