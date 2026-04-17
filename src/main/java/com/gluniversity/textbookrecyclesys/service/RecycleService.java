package com.gluniversity.textbookrecyclesys.service;

import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecycleService {
    private final RecycleAppointmentRepository appointmentRepository;
    private final EvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final InventoryRecordRepository inventoryRecordRepository;
    private final PointsRuleRepository pointsRuleRepository;
    private final PrizeExchangeRepository prizeExchangeRepository;
    private final BookExchangeRepository bookExchangeRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    private static final AtomicInteger counter = new AtomicInteger(1);

    @Transactional
    public RecycleAppointment submitAppointment(RecycleAppointment appointment, Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        String appointmentId = generateAppointmentId();
        appointment.setAppointmentId(appointmentId);
        appointment.setStudentId(studentId);
        appointment.setStudentName(student.getName());
        appointment.setStudentUsername(student.getUsername());
        appointment.setStatus("PENDING");
        appointment.setSubmitTime(LocalDateTime.now());
        
        return appointmentRepository.save(appointment);
    }

    private synchronized String generateAppointmentId() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String base = "AP-" + dateStr + "-";
        List<RecycleAppointment> todayApps = appointmentRepository.findAll().stream()
                .filter(a -> a.getAppointmentId() != null && a.getAppointmentId().startsWith(base))
                .toList();
        int maxNum = 0;
        for (RecycleAppointment app : todayApps) {
            try {
                String numStr = app.getAppointmentId().substring(base.length());
                maxNum = Math.max(maxNum, Integer.parseInt(numStr));
            } catch (Exception ignored) {}
        }
        return base + String.format("%03d", maxNum + 1);
    }

    public List<RecycleAppointment> getAppointmentsByStudent(Long studentId) {
        return appointmentRepository.findByStudentIdOrderBySubmitTimeDesc(studentId);
    }

    public List<RecycleAppointment> getAllAppointments() {
        return appointmentRepository.findAllByOrderBySubmitTimeDesc();
    }

    public List<RecycleAppointment> getAppointmentsByStatus(String status) {
        return appointmentRepository.findByStatusOrderBySubmitTimeDesc(status);
    }

    public List<RecycleAppointment> searchAppointments(String keyword) {
        return appointmentRepository.searchAppointments(keyword);
    }

    public List<Evaluation> searchEvaluations(String keyword) {
        return evaluationRepository.searchEvaluations(keyword);
    }

    @Transactional
    public Evaluation approveAppointment(Long appointmentId, String adminCondition, String operatorName) {
        RecycleAppointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));

        appointment.setStatus("APPROVED");
        appointmentRepository.save(appointment);

        PointsRule rule = pointsRuleRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    PointsRule r = new PointsRule();
                    r.setRuleNew(200);
                    r.setRuleGood(150);
                    r.setRuleNormal(80);
                    r.setRuleOld(40);
                    return pointsRuleRepository.save(r);
                });

        int points = switch (adminCondition) {
            case "全新" -> rule.getRuleNew();
            case "良好" -> rule.getRuleGood();
            case "一般" -> rule.getRuleNormal();
            case "陈旧" -> rule.getRuleOld();
            default -> 0;
        };

        Evaluation evaluation = new Evaluation();
        evaluation.setAppointmentId(appointment.getAppointmentId());
        evaluation.setStudentId(appointment.getStudentId());
        evaluation.setStudentName(appointment.getStudentName());
        evaluation.setStudentUsername(appointment.getStudentUsername());
        evaluation.setBookName(appointment.getBookName());
        evaluation.setIsbn(appointment.getIsbn());
        evaluation.setPublisher(appointment.getPublisher());
        evaluation.setSelfCondition(appointment.getCondition());
        evaluation.setAdminCondition(adminCondition);
        evaluation.setPoints(points);
        evaluation.setCoverImage(appointment.getCoverImage());
        evaluation.setRemark(appointment.getRemark());
        evaluation.setStatus("APPROVED");
        evaluation.setSubmitTime(appointment.getSubmitTime());
        evaluation.setEvaluateTime(LocalDateTime.now());
        
        return evaluationRepository.save(evaluation);
    }

    @Transactional
    public void rejectAppointment(Long appointmentId) {
        RecycleAppointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));
        appointment.setStatus("REJECTED");
        appointmentRepository.save(appointment);
        
        // 通知学生预约被拒绝
        notificationService.createNotification(
                appointment.getStudentId(),
                appointment.getStudentName(),
                "预约被拒绝",
                "您提交的教材【" + appointment.getBookName() + "】信息有误，请重新填写后提交。",
                "APPOINTMENT_REJECTED",
                appointmentId
        );
    }

    public List<Evaluation> getAllEvaluations() {
        return evaluationRepository.findAllByOrderBySubmitTimeDesc();
    }

    public List<Evaluation> getEvaluationsByStudent(Long studentId) {
        return evaluationRepository.findByStudentIdOrderBySubmitTimeDesc(studentId);
    }

    public List<Evaluation> getEvaluationsByStatus(String status) {
        return evaluationRepository.findByStatusOrderBySubmitTimeDesc(status);
    }

    @Transactional
    public void syncPointsToStudent(Long evaluationId) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new RuntimeException("评估记录不存在"));
        
        if (!"APPROVED".equals(evaluation.getStatus())) {
            throw new RuntimeException("只能同步已通过的评估");
        }

        userService.addPoints(evaluation.getStudentId(), evaluation.getPoints(),
                "REYCLE", evaluation.getBookName(), "BOOK");
        
        evaluation.setStatus("SYNCED");
        evaluationRepository.save(evaluation);
    }

    @Transactional
    public Book listBook(Long evaluationId, String operatorName) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new RuntimeException("评估记录不存在"));

        Book book = new Book();
        book.setName(evaluation.getBookName());
        book.setPublisher(evaluation.getPublisher());
        book.setIsbn(evaluation.getIsbn());
        book.setCondition(evaluation.getAdminCondition());
        book.setPoints(evaluation.getPoints());
        book.setStock(1);
        book.setCoverImage(evaluation.getCoverImage());
        book.setMajor("通用");
        book.setStatus("LISTED");
        book.setCreateTime(LocalDateTime.now());
        book = bookRepository.save(book);

        // 自动入库记录
        InventoryRecord record = new InventoryRecord();
        record.setBookId(book.getId());
        record.setBookName(book.getName());
        record.setType("IN");
        record.setQuantity(1);
        record.setOperator(operatorName != null ? operatorName : "系统");
        record.setRemark("评估上架: " + evaluation.getBookName());
        record.setCreateTime(LocalDateTime.now());
        inventoryRecordRepository.save(record);

        evaluation.setStatus("LISTED");
        evaluationRepository.save(evaluation);

        return book;
    }

    @Transactional
    public void delistBook(Long evaluationId) {
        Evaluation evaluation = evaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new RuntimeException("评估记录不存在"));
        evaluation.setStatus("DELISTED");
        evaluationRepository.save(evaluation);
    }

    // ===== 图表统计数据 =====
    public Map<String, Object> getChartStats() {
        List<Evaluation> evaluations = evaluationRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("MM-dd");

        // 1. 教材回收量统计（近7天，每天数据）→ 折线图
        List<Integer> dailyRecycleData = new ArrayList<>();
        List<String> dailyLabels = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = now.minusDays(i).toLocalDate();
            LocalDateTime dayStart = day.atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            long count = evaluations.stream()
                    .filter(e -> e.getEvaluateTime() != null)
                    .filter(e -> {
                        LocalDateTime t = e.getEvaluateTime();
                        return !t.isBefore(dayStart) && t.isBefore(dayEnd);
                    })
                    .count();
            dailyRecycleData.add((int) count);
            dailyLabels.add(day.format(dayFmt));
        }

        // 2. 教材兑换率统计（已完成兑换，按书籍名称分组）→ 饼图
        List<BookExchange> bookExchanges = bookExchangeRepository.findAllByOrderByExchangeTimeDesc();
        Map<String, Long> bookCount = bookExchanges.stream()
                .filter(e -> e.getBookName() != null && !e.getBookName().isEmpty())
                .collect(Collectors.groupingBy(BookExchange::getBookName, Collectors.counting()));
        List<String> exchangeLabels = new ArrayList<>(bookCount.keySet());
        List<Long> exchangeData = new ArrayList<>(bookCount.values());
        if (exchangeLabels.isEmpty()) {
            exchangeLabels = List.of("暂无兑换数据");
            exchangeData = List.of(0L);
        }

        // 3. 热门教材统计（按评估量排名，取前5）→ 柱状图
        Map<String, Long> bookEvalCount = evaluations.stream()
                .filter(e -> e.getBookName() != null && !e.getBookName().isEmpty())
                .collect(Collectors.groupingBy(Evaluation::getBookName, Collectors.counting()));
        List<Map.Entry<String, Long>> topBooks = bookEvalCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .toList();
        List<String> popularLabels = topBooks.stream().map(Map.Entry::getKey).toList();
        List<Integer> popularData = topBooks.stream().map(e -> e.getValue().intValue()).toList();
        if (popularLabels.isEmpty()) {
            popularLabels = List.of("暂无数据");
            popularData = List.of(0);
        }

        return Map.of(
                "dailyLabels", dailyLabels,
                "dailyRecycleData", dailyRecycleData,
                "exchangeLabels", exchangeLabels,
                "exchangeData", exchangeData,
                "popularLabels", popularLabels,
                "popularData", popularData
        );
    }
}
