package com.householdledger.inventory.repository;

import com.householdledger.common.domain.ItemKind;
import com.householdledger.inventory.domain.LedgerItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LedgerItemRepository extends JpaRepository<LedgerItem, Long> {
    List<LedgerItem> findByUserIdOrderByUpdatedAtDesc(Long userId);

    List<LedgerItem> findByUserIdAndKindOrderByUpdatedAtDesc(Long userId, ItemKind kind);

    Optional<LedgerItem> findByPublicIdAndUserId(String publicId, Long userId);

    long countByUserId(Long userId);
}
