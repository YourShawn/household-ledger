package com.householdledger;

import com.householdledger.inventory.service.ShareService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AutoSendScheduler {
    private static final Logger log = LoggerFactory.getLogger(AutoSendScheduler.class);
    private final ShareService shares;

    public AutoSendScheduler(ShareService shares) {
        this.shares = shares;
    }

    @Scheduled(cron = "${ledger.auto-send.cron:0 */15 * * * *}")
    public void tick() {
        int fired = shares.processDueAutoSends();
        if (fired > 0) {
            log.info("Processed {} due auto-send(s)", fired);
        }
    }
}
