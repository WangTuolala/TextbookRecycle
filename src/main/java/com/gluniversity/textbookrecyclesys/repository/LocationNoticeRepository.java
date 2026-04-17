package com.gluniversity.textbookrecyclesys.repository;

import com.gluniversity.textbookrecyclesys.entity.LocationNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LocationNoticeRepository extends JpaRepository<LocationNotice, Long> {
    Optional<LocationNotice> findByIsActiveTrue();
    Optional<LocationNotice> findByIsActiveTrueAndPublisherRole(String publisherRole);
    java.util.List<LocationNotice> findByPublisherRoleOrderByPublishTimeDesc(String publisherRole);
}
