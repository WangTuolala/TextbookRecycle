package com.gluniversity.textbookrecyclesys.service;

import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.*;
import lombok.RequiredArgsConstructor;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {
    private final AnnouncementRepository announcementRepository;
    private final NoticeRepository noticeRepository;
    private final LocationNoticeRepository locationNoticeRepository;
    private final AnnouncementReadRepository announcementReadRepository;

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findByOrderByPublishTimeDesc();
    }

    public List<Announcement> getAnnouncementsByRole(String publisherRole) {
        if (publisherRole == null || publisherRole.isEmpty()) {
            return announcementRepository.findByOrderByPublishTimeDesc();
        }
        return announcementRepository.findByPublisherRoleOrderByPublishTimeDesc(publisherRole);
    }

    public Announcement publishAnnouncement(String title, String content, String publisher, String publisherRole) {
        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setPublisher(publisher);
        announcement.setPublisherRole(publisherRole);
        announcement.setPublishTime(LocalDateTime.now());
        return announcementRepository.save(announcement);
    }

    public void deleteAnnouncement(Long id) {
        announcementRepository.deleteById(id);
    }

    public List<Notice> getAllNotices() {
        return noticeRepository.findByOrderByPublishTimeDesc();
    }

    public Notice publishNotice(String title, String content, String publisher) {
        Notice notice = new Notice();
        notice.setTitle(title);
        notice.setContent(content);
        notice.setPublisher(publisher);
        notice.setPublishTime(LocalDateTime.now());
        return noticeRepository.save(notice);
    }

    public void deleteNotice(Long id) {
        noticeRepository.deleteById(id);
    }

    public LocationNotice getActiveLocationNotice() {
        return locationNoticeRepository.findByIsActiveTrue().orElse(null);
    }

    public LocationNotice getActiveLocationNoticeByRole(String publisherRole) {
        return locationNoticeRepository.findByIsActiveTrueAndPublisherRole(publisherRole).orElse(null);
    }

    public LocationNotice publishLocationNotice(String location, String notice, String publisher, String publisherRole) {
        String decodedPublisher = publisher;
        try {
            decodedPublisher = URLDecoder.decode(publisher, StandardCharsets.UTF_8.toString());
        } catch (Exception e) {
            // 解码失败使用原始值
        }

        locationNoticeRepository.findByIsActiveTrueAndPublisherRole(publisherRole)
                .ifPresent(old -> {
                    old.setIsActive(false);
                    locationNoticeRepository.save(old);
                });

        LocationNotice newNotice = new LocationNotice();
        newNotice.setLocation(location);
        newNotice.setNotice(notice);
        newNotice.setPublisher(decodedPublisher);
        newNotice.setPublisherRole(publisherRole);
        newNotice.setIsActive(true);
        newNotice.setPublishTime(LocalDateTime.now());
        return locationNoticeRepository.save(newNotice);
    }

    public void deleteLocationNotice(Long id) {
        locationNoticeRepository.deleteById(id);
    }

    public List<LocationNotice> getLocationNotices(String publisherRole) {
        if (publisherRole == null || publisherRole.isEmpty()) {
            return locationNoticeRepository.findAll();
        }
        return locationNoticeRepository.findByPublisherRoleOrderByPublishTimeDesc(publisherRole);
    }

    // ==================== 已读状态管理 ====================

    @Transactional
    public void markAnnouncementAsRead(Long studentId, Long announcementId) {
        announcementReadRepository.markAsRead(studentId, announcementId, "ANNOUNCEMENT");
    }

    @Transactional
    public void markLocationNoticeAsRead(Long studentId, Long noticeId) {
        announcementReadRepository.markAsRead(studentId, noticeId, "LOCATION_NOTICE");
    }

    @Transactional(readOnly = true)
    public List<Long> getReadAnnouncementIds(Long studentId) {
        return announcementReadRepository.findReadAnnouncementIds(studentId, "ANNOUNCEMENT");
    }

    @Transactional(readOnly = true)
    public List<Long> getReadLocationNoticeIds(Long studentId) {
        return announcementReadRepository.findReadAnnouncementIds(studentId, "LOCATION_NOTICE");
    }
}