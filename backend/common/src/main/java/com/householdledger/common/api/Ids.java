package com.householdledger.common.api;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

public final class Ids {
    private static final SecureRandom RANDOM = new SecureRandom();

    private Ids() {
    }

    public static String publicId() {
        return UUID.randomUUID().toString();
    }

    public static String cryptoSalt() {
        byte[] bytes = new byte[16];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
