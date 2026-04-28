package com.gluniversity.textbookrecyclesys.service;

import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PointsRecordRepository pointsRecordRepository;
    private final PointsRuleRepository pointsRuleRepository;

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User register(User user) {
        System.out.println("=== [UserService] Register called ===");
        if (userRepository.existsByUsername(user.getUsername())) {
            System.out.println("Username already exists: " + user.getUsername());
            throw new RuntimeException("用户名已存在");
        }
        System.out.println("Username available, saving user...");
        user.setPoints(0);
        user.setCreateTime(LocalDateTime.now());
        User saved = userRepository.save(user);
        System.out.println("User saved with ID: " + saved.getId());
        return saved;
    }

    public User login(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getPassword().equals(password))
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));
    }

    public User updateProfile(Long userId, User updatedUser) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        if (updatedUser.getName() != null && !updatedUser.getName().isBlank()) user.setName(updatedUser.getName());
        if (updatedUser.getPhone() != null) user.setPhone(updatedUser.getPhone());
        if (updatedUser.getCollege() != null) user.setCollege(updatedUser.getCollege());
        if (updatedUser.getMajor() != null) user.setMajor(updatedUser.getMajor());
        if (updatedUser.getClassName() != null) user.setClassName(updatedUser.getClassName());
        if (updatedUser.getYear() != null) user.setYear(updatedUser.getYear());
        return userRepository.save(user);
    }

    public User updatePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        if (!user.getPassword().equals(oldPassword)) {
            throw new RuntimeException("原密码错误");
        }
        user.setPassword(newPassword);
        return userRepository.save(user);
    }

    public void addPoints(Long userId, Integer points, String type, String description, String category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setPoints(user.getPoints() + points);
        userRepository.save(user);

        PointsRecord record = new PointsRecord();
        record.setUserId(userId);
        record.setUserName(user.getName());
        record.setType(type);
        record.setPoints(points);
        record.setBalance(user.getPoints());
        record.setDescription(description);
        record.setCategory(category);
        record.setCreateTime(LocalDateTime.now());
        pointsRecordRepository.save(record);
    }

    public void deductPoints(Long userId, Integer points, String type, String description, String category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        if (user.getPoints() < points) {
            throw new RuntimeException("积分不足");
        }
        user.setPoints(user.getPoints() - points);
        userRepository.save(user);

        PointsRecord record = new PointsRecord();
        record.setUserId(userId);
        record.setUserName(user.getName());
        record.setType(type);
        record.setPoints(-points);
        record.setBalance(user.getPoints());
        record.setDescription(description);
        record.setCategory(category);
        record.setCreateTime(LocalDateTime.now());
        pointsRecordRepository.save(record);
    }

    public List<PointsRecord> getPointsRecords(Long userId) {
        return pointsRecordRepository.findByUserIdOrderByCreateTimeDesc(userId);
    }

    public Integer getPoints(Long userId) {
        return userRepository.findById(userId)
                .map(User::getPoints)
                .orElse(0);
    }
}
