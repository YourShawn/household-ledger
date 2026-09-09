package com.householdledger;

import com.householdledger.auth.domain.User;
import com.householdledger.auth.repository.UserRepository;
import com.householdledger.common.api.Ids;
import com.householdledger.common.domain.SharingTier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.SpringApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;

@SpringBootApplication(scanBasePackages = "com.householdledger")
@EntityScan("com.householdledger")
@EnableJpaRepositories("com.householdledger")
@EnableScheduling
@ConfigurationPropertiesScan
public class HouseholdLedgerApplication {
    private static final Logger log = LoggerFactory.getLogger(HouseholdLedgerApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(HouseholdLedgerApplication.class, args);
    }

    @Bean
    ApplicationRunner seedRunner(
            UserRepository users,
            PasswordEncoder passwordEncoder,
            @Value("${ledger.seed:true}") boolean seed
    ) {
        return (ApplicationArguments args) -> {
            if (!seed) {
                return;
            }
            String email = "demo@household-ledger.local";
            if (users.existsByEmailIgnoreCase(email)) {
                return;
            }
            User demo = new User();
            demo.setEmail(email);
            demo.setPasswordHash(passwordEncoder.encode("DemoPass123!"));
            demo.setDisplayName("演示用户 / Demo");
            demo.setSharingTier(SharingTier.MANUAL_SHARE);
            demo.setCryptoSalt(Ids.cryptoSalt());
            users.save(demo);
            log.info("Seeded demo user {} / DemoPass123!", email);
        };
    }
}
