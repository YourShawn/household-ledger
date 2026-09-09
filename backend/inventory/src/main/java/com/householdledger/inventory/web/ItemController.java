package com.householdledger.inventory.web;

import com.householdledger.common.domain.ItemKind;
import com.householdledger.common.security.CurrentUser;
import com.householdledger.inventory.service.ItemService;
import com.householdledger.inventory.web.InventoryDtos.ItemResponse;
import com.householdledger.inventory.web.InventoryDtos.ItemWriteRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@Tag(name = "Inventory")
public class ItemController {
    private final ItemService items;

    public ItemController(ItemService items) {
        this.items = items;
    }

    @GetMapping
    @Operation(summary = "List ciphertext items for the current user")
    public List<ItemResponse> list(@RequestParam(required = false) ItemKind kind) {
        return items.list(CurrentUser.require().getUserId(), kind);
    }

    @GetMapping("/{id}")
    public ItemResponse get(@PathVariable String id) {
        return items.get(CurrentUser.require().getUserId(), id);
    }

    @PostMapping
    @Operation(summary = "Store an encrypted item. Server never sees plaintext.")
    public ItemResponse create(@Valid @RequestBody ItemWriteRequest request) {
        return items.create(CurrentUser.require().getUserId(), request);
    }

    @PutMapping("/{id}")
    public ItemResponse update(@PathVariable String id, @Valid @RequestBody ItemWriteRequest request) {
        return items.update(CurrentUser.require().getUserId(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        items.delete(CurrentUser.require().getUserId(), id);
    }
}
