package com.householdledger.inventory.repository;

import com.householdledger.inventory.domain.Share;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShareRepository extends JpaRepository<Share, Long> {
    Optional<Share> findByPublicId(String publicId);

    List<Share> findByUserIdOrderByCreatedAtDesc(Long userId);
}
