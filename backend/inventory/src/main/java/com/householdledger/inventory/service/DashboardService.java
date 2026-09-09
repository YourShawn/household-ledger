package com.householdledger.inventory.service;

import com.householdledger.auth.service.AuthService;
import com.householdledger.common.domain.ItemKind;
import com.householdledger.inventory.repository.LedgerItemRepository;
import com.householdledger.inventory.repository.RecipientRepository;
import com.householdledger.inventory.web.InventoryDtos.DashboardResponse;
import com.householdledger.inventory.web.InventoryDtos.KindCount;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
public class DashboardService {
    private final LedgerItemRepository items;
    private final RecipientRepository recipients;
    private final AuthService authService;

    public DashboardService(LedgerItemRepository items, RecipientRepository recipients, AuthService authService) {
        this.items = items;
        this.recipients = recipients;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard(Long userId) {
        var user = authService.me(userId);
        List<KindCount> byKind = Arrays.stream(ItemKind.values())
                .map(kind -> new KindCount(kind, items.findByUserIdAndKindOrderByUpdatedAtDesc(userId, kind).size()))
                .toList();
        return new DashboardResponse(
                items.countByUserId(userId),
                recipients.countByUserId(userId),
                user.sharingTier(),
                user.lastCheckInAt(),
                user.checkInIntervalDays(),
                user.autoSendArmed(),
                user.autoSendTriggeredAt(),
                byKind
        );
    }
}
