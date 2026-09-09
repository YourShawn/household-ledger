package com.householdledger.inventory.repository;

import com.householdledger.inventory.domain.OutboundNotice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OutboundNoticeRepository extends JpaRepository<OutboundNotice, Long> {
    List<OutboundNotice> findByUserIdOrderByCreatedAtDesc(Long userId);
}
