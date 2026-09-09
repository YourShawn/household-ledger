package com.householdledger.inventory.web;

import com.householdledger.common.security.CurrentUser;
import com.householdledger.inventory.service.ShareService;
import com.householdledger.inventory.web.InventoryDtos.ArmAutoSendRequest;
import com.householdledger.inventory.web.InventoryDtos.NoticeResponse;
import com.householdledger.inventory.web.InventoryDtos.PublicShareResponse;
import com.householdledger.inventory.web.InventoryDtos.ShareCreateRequest;
import com.householdledger.inventory.web.InventoryDtos.ShareResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Shares")
public class ShareController {
    private final ShareService shares;

    public ShareController(ShareService shares) {
        this.shares = shares;
    }

    @PostMapping("/shares")
    @Operation(summary = "Create a manual share of an already-encrypted bundle")
    public ShareResponse create(@Valid @RequestBody ShareCreateRequest request) {
        return shares.createManual(CurrentUser.require().getUserId(), request);
    }

    @GetMapping("/shares")
    public List<ShareResponse> mine() {
        return shares.listMine(CurrentUser.require().getUserId());
    }

    @GetMapping("/shares/{token}")
    @Operation(summary = "Public retrieval of ciphertext only")
    public PublicShareResponse getPublic(@PathVariable String token) {
        return shares.getPublic(token);
    }

    @PostMapping("/auto-send/arm")
    @Operation(summary = "Upload encrypted dead-man bundle and arm missed-check-in send")
    public ShareResponse arm(@Valid @RequestBody ArmAutoSendRequest request) {
        return shares.armAutoSend(CurrentUser.require().getUserId(), request);
    }

    @PostMapping("/auto-send/disarm")
    public Map<String, Boolean> disarm() {
        shares.disarm(CurrentUser.require().getUserId());
        return Map.of("armed", false);
    }

    @GetMapping("/notices")
    public List<NoticeResponse> notices() {
        return shares.notices(CurrentUser.require().getUserId());
    }
}
