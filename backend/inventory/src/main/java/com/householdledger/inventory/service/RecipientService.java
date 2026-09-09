package com.householdledger.inventory.service;

import com.householdledger.common.exception.ApiException;
import com.householdledger.inventory.domain.Recipient;
import com.householdledger.inventory.repository.RecipientRepository;
import com.householdledger.inventory.web.InventoryDtos.RecipientResponse;
import com.householdledger.inventory.web.InventoryDtos.RecipientWriteRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RecipientService {
    private final RecipientRepository recipients;

    public RecipientService(RecipientRepository recipients) {
        this.recipients = recipients;
    }

    @Transactional(readOnly = true)
    public List<RecipientResponse> list(Long userId) {
        return recipients.findByUserIdOrderByCreatedAtAsc(userId).stream().map(RecipientService::toResponse).toList();
    }

    @Transactional
    public RecipientResponse create(Long userId, RecipientWriteRequest request) {
        String email = request.email().trim().toLowerCase();
        if (recipients.existsByUserIdAndEmailIgnoreCase(userId, email)) {
            throw ApiException.conflict("RECIPIENT_EXISTS", "This recipient email is already on your list");
        }
        Recipient recipient = new Recipient();
        recipient.setUserId(userId);
        recipient.setName(request.name().trim());
        recipient.setEmail(email);
        recipient.setRelationship(blankToNull(request.relationship()));
        recipients.save(recipient);
        return toResponse(recipient);
    }

    @Transactional
    public void delete(Long userId, String publicId) {
        Recipient recipient = recipients.findByPublicIdAndUserId(publicId, userId)
                .orElseThrow(() -> ApiException.notFound("Recipient not found"));
        recipients.delete(recipient);
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    static RecipientResponse toResponse(Recipient recipient) {
        return new RecipientResponse(
                recipient.getPublicId(),
                recipient.getName(),
                recipient.getEmail(),
                recipient.getRelationship(),
                recipient.getCreatedAt()
        );
    }
}
