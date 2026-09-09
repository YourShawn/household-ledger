package com.householdledger.inventory.repository;

import com.householdledger.inventory.domain.Recipient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecipientRepository extends JpaRepository<Recipient, Long> {
    List<Recipient> findByUserIdOrderByCreatedAtAsc(Long userId);

    Optional<Recipient> findByPublicIdAndUserId(String publicId, Long userId);

    boolean existsByUserIdAndEmailIgnoreCase(Long userId, String email);

    long countByUserId(Long userId);
}
