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
    private final UserService userService;

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
        List<Book> books = bookRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sixWeeksAgo = now.minusWeeks(6);
        LocalDateTime sixMonthsAgo = now.minusMonths(6);

        // 1. 教材回收量统计（近6周，每周数据）
        List<Integer> weeklyRecycleData = new ArrayList<>();
        List<String> weeklyLabels = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime weekStart = now.minusWeeks(i).with(java.time.DayOfWeek.MONDAY).toLocalDate().atStartOfDay();
            LocalDateTime weekEnd = weekStart.plusDays(7);
            int count = (int) evaluations.stream()
                    .filter(e -> e.getEvaluateTime() != null)
                    .filter(e -> {
                        LocalDateTime t = e.getEvaluateTime();
                        return !t.isBefore(weekStart) && t.isBefore(weekEnd);
                    })
                    .count();
            weeklyRecycleData.add(count);
            weeklyLabels.add("第" + (6 - i) + "周");
        }

        // 2. 教材兑换率统计（按学科分类）
        Map<String, Long> majorCount = books.stream()
                .filter(b -> b.getMajor() != null && !b.getMajor().isEmpty())
                .collect(Collectors.groupingBy(Book::getMajor, Collectors.counting()));
        List<String> exchangeLabels = new ArrayList<>(majorCount.keySet());
        List<Long> exchangeData = new ArrayList<>(majorCount.values());
        
        // 如果没有数据，显示默认
        if (exchangeLabels.isEmpty()) {
            exchangeLabels = List.of("暂无数据");
            exchangeData = List.of(0L);
        }

        // 3. 学科分类统计（近6个月，每月每类数据）
        List<String> monthLabels = new ArrayList<>();
        List<String> allMajors = new ArrayList<>(new HashSet<>(
                evaluations.stream()
                        .filter(e -> e.getBookName() != null)
                        .map(e -> {
                            // 从书名推断学科（实际应该从book的major来，这里简化处理）
                            return "通用";
                        })
                        .toList()
        ));
        if (allMajors.isEmpty()) allMajors.add("通用");
        
        // 按月统计
        Map<String, Map<String, Integer>> monthlyMajorData = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).toLocalDate().atStartOfDay();
            LocalDateTime monthEnd = monthStart.plusMonths(1);
            String monthLabel = (monthStart.getYear()) + "-" + String.format("%02d", monthStart.getMonthValue());
            monthLabels.add(monthLabel);
            
            // 统计该月各学科评估数
            Map<String, Integer> majorCounts = evaluations.stream()
                    .filter(e -> e.getEvaluateTime() != null)
                    .filter(e -> {
                        LocalDateTime t = e.getEvaluateTime();
                        return !t.isBefore(monthStart) && t.isBefore(monthEnd);
                    })
                    .collect(Collectors.groupingBy(e -> "通用", Collectors.collectingAndThen(Collectors.counting(), Long::intValue)));
            
            for (String major : allMajors) {
                majorCounts.putIfAbsent(major, 0);
            }
            monthlyMajorData.put(monthLabel, majorCounts);
        }

        return Map.of(
                "weeklyLabels", weeklyLabels,
                "weeklyRecycleData", weeklyRecycleData,
                "exchangeLabels", exchangeLabels,
                "exchangeData", exchangeData,
                "monthLabels", monthLabels,
                "monthlyMajorData", monthlyMajorData,
                "allMajors", allMajors
        );
    }
}
