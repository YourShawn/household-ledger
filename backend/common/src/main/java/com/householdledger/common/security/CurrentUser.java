package com.householdledger.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {
    private CurrentUser() {
    }

    public static LedgerPrincipal require() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof LedgerPrincipal principal)) {
            throw new IllegalStateException("Authenticated principal is missing");
        }
        return principal;
    }
}
