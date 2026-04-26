package com.gluniversity.textbookrecyclesys.controller;

import com.gluniversity.textbookrecyclesys.dto.*;
import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/logistics")
@RequiredArgsConstructor
public class LogisticsController {
    private final PrizeService prizeService;
    private final AnnouncementService announcementService;
    private final UserService userService;

    // ===== 奖品管理 =====
    @GetMapping("/prizes")
    public ResponseEntity<ApiResponse<List<Prize>>> getPrizes() {
        return ResponseEntity.ok(ApiResponse.success(prizeService.getAllPrizes()));
    }

    @PostMapping("/prizes")
    public ResponseEntity<ApiResponse<Prize>> addPrize(@RequestBody PrizeRequest request) {
        try {
            Prize prize = new Prize();
            prize.setName(request.getName());
            prize.setPoints(request.getPoints());
            prize.setStock(request.getStock());
            prize.setImageData(request.getImageData());
            Prize saved = prizeService.addPrize(prize);
            return ResponseEntity.ok(ApiResponse.success("添加成功", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/prizes/{id}")
    public ResponseEntity<ApiResponse<Prize>> updatePrize(@PathVariable Long id, @RequestBody PrizeRequest request) {
        try {
            Prize prize = new Prize();
            prize.setName(request.getName());
            prize.setPoints(request.getPoints());
            prize.setStock(request.getStock());
            prize.setImageData(request.getImageData());
            Prize updated = prizeService.updatePrize(id, prize);
            return ResponseEntity.ok(ApiResponse.success("更新成功", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/prizes/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePrize(@PathVariable Long id) {
        try {
            prizeService.deletePrize(id);
            return ResponseEntity.ok(ApiResponse.success("删除成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== 领取管理 =====
    @GetMapping("/exchanges/pending")
    public ResponseEntity<ApiResponse<List<PrizeExchange>>> getPendingExchanges() {
        return ResponseEntity.ok(ApiResponse.success(prizeService.getAllPendingExchanges()));
    }

    @GetMapping("/exchanges/completed")
    public ResponseEntity<ApiResponse<List<PrizeExchange>>> getCompletedExchanges() {
        return ResponseEntity.ok(ApiResponse.success(prizeService.getAllCompletedExchanges()));
    }

    @PostMapping("/exchanges/{id}/pickup")
    public ResponseEntity<ApiResponse<Void>> confirmPickup(@PathVariable Long id) {
        try {
            prizeService.confirmPickup(id);
            return ResponseEntity.ok(ApiResponse.success("领取确认成功", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== 积分规则 =====
    @GetMapping("/points-rule")
    public ResponseEntity<ApiResponse<PointsRule>> getPointsRule() {
        return ResponseEntity.ok(ApiResponse.success(prizeService.getPointsRule()));
    }

    // ===== 个人信息 =====
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
            String decodedOperator = (operatorName != null && !operatorName.isEmpty()) 
                    ? URLDecoder.decode(operatorName, StandardCharsets.UTF_8.toString()) 
                    : "后勤";
            Announcement announcement = announcementService.publishAnnouncement(
                    request.get("title"),
                    request.get("content"),
                    decodedOperator,
                    "LOGISTICS"
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
            String operator = (operatorName != null && !operatorName.isEmpty()) ? operatorName : "后勤";
            LocationNotice notice = announcementService.publishLocationNotice(
                    request.get("location"),
                    request.get("notice"),
                    operator,
                    "LOGISTICS"
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
}
