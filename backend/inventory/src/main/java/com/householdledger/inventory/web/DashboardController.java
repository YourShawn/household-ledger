package com.householdledger.inventory.web;

import com.householdledger.common.security.CurrentUser;
import com.householdledger.inventory.service.DashboardService;
import com.householdledger.inventory.web.InventoryDtos.DashboardResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard")
public class DashboardController {
    private final DashboardService dashboard;

    public DashboardController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping
    public DashboardResponse get() {
        return dashboard.dashboard(CurrentUser.require().getUserId());
    }
}
