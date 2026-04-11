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

    // ===== 数据统计 =====
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        int totalRecycled = recycleService.getAllEvaluations().size();
        int totalExchanged = prizeService.getAllExchanges().stream().filter(e -> "COMPLETED".equals(e.getStatus())).toList().size();
        int pendingAppointments = recycleService.getAppointmentsByStatus("PENDING").size();
        List<Book> lowStockBooks = inventoryService.getLowStockBooks();
        
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "totalRecycled", totalRecycled,
                "totalExchanged", totalExchanged,
                "pendingAppointments", pendingAppointments,
                "lowStockBooks", lowStockBooks
        )));
    }

    @GetMapping("/stats/charts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChartStats() {
        Map<String, Object> chartData = recycleService.getChartStats();
        return ResponseEntity.ok(ApiResponse.success(chartData));
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
    public ResponseEntity<ApiResponse<Book>> addBook(@RequestBody BookRequest request) {
        try {
            Book book = new Book();
            book.setName(request.getName());
            book.setAuthor(request.getAuthor());
            book.setPublisher(request.getPublisher());
            book.setIsbn(request.getIsbn());
            book.setMajor(request.getMajor());
            book.setPoints(request.getPoints());
            book.setStock(request.getStock());
            book.setCoverImage(request.getCoverImage());
            Book saved = bookService.addBook(book);
            return ResponseEntity.ok(ApiResponse.success("添加成功", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Book>> updateBook(@PathVariable Long id, @RequestBody BookRequest request) {
        try {
            Book book = new Book();
            book.setName(request.getName());
            book.setAuthor(request.getAuthor());
            book.setPublisher(request.getPublisher());
            book.setIsbn(request.getIsbn());
            book.setMajor(request.getMajor());
            book.setPoints(request.getPoints());
            book.setStock(request.getStock());
            book.setCoverImage(request.getCoverImage());
            Book updated = bookService.updateBook(id, book);
            return ResponseEntity.ok(ApiResponse.success("更新成功", updated));
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

    @PostMapping("/appointments/{id}/approve")
    public ResponseEntity<ApiResponse<Evaluation>> approveAppointmentRequest(@PathVariable Long id) {
        try {
            Evaluation evaluation = recycleService.approveAppointment(id, "良好", "管理员");
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
    public ResponseEntity<ApiResponse<List<LocationNotice>>> getLocationNotices() {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getLocationNotices()));
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
                    operator
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
}
