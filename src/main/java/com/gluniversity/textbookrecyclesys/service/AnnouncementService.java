package com.gluniversity.textbookrecyclesys.service;

import com.gluniversity.textbookrecyclesys.entity.*;
import com.gluniversity.textbookrecyclesys.repository.*;
import lombok.RequiredArgsConstructor;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementService {
    private final AnnouncementRepository announcementRepository;
    private final NoticeRepository noticeRepository;
    private final LocationNoticeRepository locationNoticeRepository;

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findByOrderByPublishTimeDesc();
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

    public LocationNotice publishLocationNotice(String location, String notice, String publisher) {
        // 解码前端编码的 operatorName
        String decodedPublisher = publisher;
        try {
            decodedPublisher = URLDecoder.decode(publisher, StandardCharsets.UTF_8.toString());
        } catch (Exception e) {
            // 解码失败使用原始值
        }
        
        List<LocationNotice> existing = locationNoticeRepository.findAll();
        for (LocationNotice ln : existing) {
            ln.setIsActive(false);
            locationNoticeRepository.save(ln);
        }

        LocationNotice newNotice = new LocationNotice();
        newNotice.setLocation(location);
        newNotice.setNotice(notice);
        newNotice.setPublisher(decodedPublisher);
        newNotice.setIsActive(true);
        newNotice.setPublishTime(LocalDateTime.now());
        return locationNoticeRepository.save(newNotice);
    }

    public void deleteLocationNotice(Long id) {
        locationNoticeRepository.deleteById(id);
    }

    public List<LocationNotice> getLocationNotices() {
        return locationNoticeRepository.findAll();
    }
}
