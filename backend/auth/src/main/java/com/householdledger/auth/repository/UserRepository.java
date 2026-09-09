package com.householdledger.auth.repository;

import com.householdledger.auth.domain.User;
import com.householdledger.common.domain.SharingTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPublicId(String publicId);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findBySharingTierAndAutoSendArmedIsTrueAndAutoSendTriggeredAtIsNullAndLastCheckInAtBefore(
            SharingTier sharingTier,
            Instant cutoff
    );
}
