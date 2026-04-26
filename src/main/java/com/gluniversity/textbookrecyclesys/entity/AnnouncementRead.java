package com.gluniversity.textbookrecyclesys.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 公告/领取须知 已读状态表
 * 记录每个学生对每条公告/领取须知的已读状态
 */
@Data
@Entity
@Table(name = "announcement_read")
public class AnnouncementRead {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long studentId;          // 学生ID
    
    @Column(nullable = false)
    private Long announcementId;     // 公告/领取须知ID（若是领取须知则存 location_notice 的 id，附加类型标识）
    
    @Column(nullable = false)
    private String type;            // 类型：ANNOUNCEMENT（系统公告）或 LOCATION_NOTICE（领取须知）
    
    @Column(nullable = false)
    private Boolean isRead = false;  // 是否已读
    
    private LocalDateTime readAt;    // 阅读时间
    
    // 联合唯一索引，防止重复记录
    @PrePersist
    public void prePersist() {
        // 确保同一个学生对同一条公告只有一条记录
    }
}