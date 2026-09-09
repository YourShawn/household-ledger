package com.householdledger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.householdledger.auth.domain.User;
import com.householdledger.auth.repository.UserRepository;
import com.householdledger.inventory.service.ShareService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthInventorySmokeTest {
    @Autowired
    MockMvc mockMvc;
    @Autowired
    ObjectMapper objectMapper;
    @Autowired
    UserRepository users;
    @Autowired
    ShareService shareService;

    @Test
    void healthAndOpenApiArePublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("物资家底账本 / Household Ledger"));
    }

    @Test
    void registerLoginMeAndCheckIn() throws Exception {
        String email = "smoke-" + UUID.randomUUID() + "@example.test";
        String token = register(email, "SmokePass123!");
        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.cryptoSalt").isString())
                .andExpect(jsonPath("$.sharingTier").value("RECORD_ONLY"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"SmokePass123!"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());

        mockMvc.perform(post("/api/auth/check-in").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastCheckInAt").isString());
    }

    @Test
    void duplicateEmailIsConflict() throws Exception {
        String email = "dup-" + UUID.randomUUID() + "@example.test";
        register(email, "SmokePass123!");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"SmokePass123!","displayName":"Other"}
                                """.formatted(email)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_TAKEN"));
    }

    @Test
    void itemCrudStoresCiphertextOnly() throws Exception {
        String token = register("item-" + UUID.randomUUID() + "@example.test", "SmokePass123!");
        MvcResult created = mockMvc.perform(post("/api/items")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"kind":"KEY","ciphertext":"cipher-demo","nonce":"nonce-demo"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kind").value("KEY"))
                .andExpect(jsonPath("$.ciphertext").value("cipher-demo"))
                .andReturn();
        String id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/api/items/" + id)
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"kind":"KEY","ciphertext":"cipher-2","nonce":"nonce-2"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ciphertext").value("cipher-2"));

        mockMvc.perform(get("/api/items").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].kind").value("KEY"));

        mockMvc.perform(delete("/api/items/" + id).header("Authorization", bearer(token)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/items").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void recordOnlyCannotShare() throws Exception {
        String token = register("noshare-" + UUID.randomUUID() + "@example.test", "SmokePass123!");
        mockMvc.perform(post("/api/shares")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ciphertext":"bundle","nonce":"n1","kdfSalt":"salt"}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("TIER_FORBIDS_SHARE"));
    }

    @Test
    void manualShareIsPublicCiphertext() throws Exception {
        String token = register("share-" + UUID.randomUUID() + "@example.test", "SmokePass123!");
        mockMvc.perform(patch("/api/auth/settings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sharingTier":"MANUAL_SHARE"}
                                """))
                .andExpect(status().isOk());
        MvcResult created = mockMvc.perform(post("/api/shares")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ciphertext":"enc-bundle","nonce":"share-nonce","kdfSalt":"share-salt"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.retrievePath").isString())
                .andReturn();
        String id = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();
        mockMvc.perform(get("/api/shares/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ciphertext").value("enc-bundle"))
                .andExpect(jsonPath("$.kdfSalt").value("share-salt"))
                .andExpect(jsonPath("$.nonce").value("share-nonce"));
    }

    @Test
    @Transactional
    void autoSendFiresAfterMissedCheckIn() throws Exception {
        String email = "auto-" + UUID.randomUUID() + "@example.test";
        String token = register(email, "SmokePass123!");
        mockMvc.perform(patch("/api/auth/settings")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sharingTier":"AUTO_SEND","checkInIntervalDays":30}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/recipients")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Pat","email":"pat@example.test","relationship":"sibling"}
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/auto-send/arm")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ciphertext":"dead-man-bundle","nonce":"dm-nonce","kdfSalt":"dm-salt"}
                                """))
                .andExpect(status().isOk());

        User user = users.findByEmailIgnoreCase(email).orElseThrow();
        user.setLastCheckInAt(Instant.now().minus(40, ChronoUnit.DAYS));
        users.saveAndFlush(user);

        int fired = shareService.processDueAutoSends();
        assertThat(fired).isGreaterThanOrEqualTo(1);

        JsonNode notices = objectMapper.readTree(
                mockMvc.perform(get("/api/notices").header("Authorization", bearer(token)))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString()
        );
        assertThat(notices.size()).isGreaterThanOrEqualTo(1);
        assertThat(notices.get(0).get("status").asText()).isEqualTo("LOGGED_NO_SMTP");
    }

    private String register(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s","displayName":"Smoke"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
