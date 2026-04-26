package com.gluniversity.textbookrecyclesys.service;

import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrizeService {
    private final PrizeRepository prizeRepository;
    private final PrizeExchangeRepository exchangeRepository;
    private final UserService userService;
    private final PointsRuleRepository pointsRuleRepository;

    public List<Prize> getAllPrizes() {
        return prizeRepository.findAll();
    }

    public Prize getPrizeById(Long id) {
        return prizeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("奖品不存在"));
    }

    @Transactional
    public Prize addPrize(Prize prize) {
        prize.setCreateTime(LocalDateTime.now());
        return prizeRepository.save(prize);
    }

    @Transactional
    public Prize updatePrize(Long id, Prize updatedPrize) {
        Prize prize = prizeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("奖品不存在"));
        prize.setName(updatedPrize.getName());
        prize.setPoints(updatedPrize.getPoints());
        prize.setStock(updatedPrize.getStock());
        prize.setImageData(updatedPrize.getImageData());
        return prizeRepository.save(prize);
    }

    @Transactional
    public void deletePrize(Long id) {
        prizeRepository.deleteById(id);
    }

    @Transactional
    public PrizeExchange exchangePrize(Long studentId, Long prizeId, Integer quantity) {
        Prize prize = prizeRepository.findById(prizeId)
                .orElseThrow(() -> new RuntimeException("奖品不存在"));
        
        Integer userPoints = userService.getPoints(studentId);
        int totalCost = prize.getPoints() * quantity;
        
        if (userPoints < totalCost) {
            throw new RuntimeException("积分不足");
        }

        if (prize.getStock() < quantity) {
            throw new RuntimeException("库存不足");
        }

        userService.deductPoints(studentId, totalCost, "EXCHANGE", prize.getName(), "PRIZE");

        prize.setStock(prize.getStock() - quantity);
        prizeRepository.save(prize);

        PrizeExchange exchange = new PrizeExchange();
        exchange.setStudentId(studentId);
        exchange.setStudentName(userService.findById(studentId).map(User::getName).orElse("未知学生"));
        exchange.setPrizeId(prizeId);
        exchange.setPrizeName(prize.getName());
        exchange.setPoints(prize.getPoints());
        exchange.setQuantity(quantity);
        exchange.setStatus("PENDING");
        exchange.setExchangeTime(LocalDateTime.now());
        
        return exchangeRepository.save(exchange);
    }

    public List<PrizeExchange> getExchangesByStudent(Long studentId) {
        return exchangeRepository.findAll().stream()
                .filter(ex -> ex.getStudentId().equals(studentId) && !"REJECTED".equals(ex.getStatus()))
                .sorted((a, b) -> b.getExchangeTime().compareTo(a.getExchangeTime()))
                .toList();
    }

    public List<PrizeExchange> getAllExchanges() {
        return exchangeRepository.findAll();
    }

    public List<PrizeExchange> getAllPendingExchanges() {
        return exchangeRepository.findAll().stream()
                .filter(e -> "PENDING".equals(e.getStatus()))
                .toList();
    }

    public List<PrizeExchange> getAllCompletedExchanges() {
        return exchangeRepository.findAll().stream()
                .filter(e -> "COMPLETED".equals(e.getStatus()))
                .toList();
    }

    @Transactional
    public void confirmPickup(Long exchangeId) {
        PrizeExchange exchange = exchangeRepository.findById(exchangeId)
                .orElseThrow(() -> new RuntimeException("兑换记录不存在"));
        exchange.setStatus("COMPLETED");
        exchange.setPickupTime(LocalDateTime.now());
        exchangeRepository.save(exchange);
    }

    public PointsRule getPointsRule() {
        return pointsRuleRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    PointsRule r = new PointsRule();
                    r.setRuleNew(200);
                    r.setRuleGood(150);
                    r.setRuleNormal(80);
                    r.setRuleOld(40);
                    r.setPrizeMax(500);
                    return pointsRuleRepository.save(r);
                });
    }

    @Transactional
    public PointsRule updatePointsRule(Integer ruleNew, Integer ruleGood, Integer ruleNormal, Integer ruleOld, Integer prizeMax) {
        PointsRule existing = getPointsRule();
        if (ruleNew != null) existing.setRuleNew(ruleNew);
        if (ruleGood != null) existing.setRuleGood(ruleGood);
        if (ruleNormal != null) existing.setRuleNormal(ruleNormal);
        if (ruleOld != null) existing.setRuleOld(ruleOld);
        if (prizeMax != null) existing.setPrizeMax(prizeMax);
        return pointsRuleRepository.save(existing);
    }
}
