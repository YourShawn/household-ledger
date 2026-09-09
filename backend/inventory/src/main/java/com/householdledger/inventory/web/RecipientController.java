package com.householdledger.inventory.web;

import com.householdledger.common.security.CurrentUser;
import com.householdledger.inventory.service.RecipientService;
import com.householdledger.inventory.web.InventoryDtos.RecipientResponse;
import com.householdledger.inventory.web.InventoryDtos.RecipientWriteRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recipients")
@Tag(name = "Recipients")
public class RecipientController {
    private final RecipientService recipients;

    public RecipientController(RecipientService recipients) {
        this.recipients = recipients;
    }

    @GetMapping
    @Operation(summary = "List optional recipients")
    public List<RecipientResponse> list() {
        return recipients.list(CurrentUser.require().getUserId());
    }

    @PostMapping
    public RecipientResponse create(@Valid @RequestBody RecipientWriteRequest request) {
        return recipients.create(CurrentUser.require().getUserId(), request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        recipients.delete(CurrentUser.require().getUserId(), id);
    }
}
