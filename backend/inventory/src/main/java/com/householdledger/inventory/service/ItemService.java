package com.householdledger.inventory.service;

import com.householdledger.common.domain.ItemKind;
import com.householdledger.common.exception.ApiException;
import com.householdledger.inventory.domain.LedgerItem;
import com.householdledger.inventory.repository.LedgerItemRepository;
import com.householdledger.inventory.web.InventoryDtos.ItemResponse;
import com.householdledger.inventory.web.InventoryDtos.ItemWriteRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ItemService {
    private final LedgerItemRepository items;

    public ItemService(LedgerItemRepository items) {
        this.items = items;
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> list(Long userId, ItemKind kind) {
        List<LedgerItem> found = kind == null
                ? items.findByUserIdOrderByUpdatedAtDesc(userId)
                : items.findByUserIdAndKindOrderByUpdatedAtDesc(userId, kind);
        return found.stream().map(ItemService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ItemResponse get(Long userId, String publicId) {
        return toResponse(require(userId, publicId));
    }

    @Transactional
    public ItemResponse create(Long userId, ItemWriteRequest request) {
        LedgerItem item = new LedgerItem();
        item.setUserId(userId);
        item.setKind(request.kind());
        item.setCiphertext(request.ciphertext());
        item.setNonce(request.nonce());
        items.save(item);
        return toResponse(item);
    }

    @Transactional
    public ItemResponse update(Long userId, String publicId, ItemWriteRequest request) {
        LedgerItem item = require(userId, publicId);
        item.setKind(request.kind());
        item.setCiphertext(request.ciphertext());
        item.setNonce(request.nonce());
        return toResponse(item);
    }

    @Transactional
    public void delete(Long userId, String publicId) {
        items.delete(require(userId, publicId));
    }

    private LedgerItem require(Long userId, String publicId) {
        return items.findByPublicIdAndUserId(publicId, userId)
                .orElseThrow(() -> ApiException.notFound("Item not found"));
    }

    static ItemResponse toResponse(LedgerItem item) {
        return new ItemResponse(
                item.getPublicId(),
                item.getKind(),
                item.getCiphertext(),
                item.getNonce(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
