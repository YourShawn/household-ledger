package com.householdledger.inventory.service;

import com.householdledger.auth.domain.User;
import com.householdledger.auth.repository.UserRepository;
import com.householdledger.common.domain.ShareKind;
import com.householdledger.common.domain.SharingTier;
import com.householdledger.common.exception.ApiException;
import com.householdledger.inventory.domain.OutboundNotice;
import com.householdledger.inventory.domain.Recipient;
import com.householdledger.inventory.domain.Share;
import com.householdledger.inventory.repository.OutboundNoticeRepository;
import com.householdledger.inventory.repository.RecipientRepository;
import com.householdledger.inventory.repository.ShareRepository;
import com.householdledger.inventory.web.InventoryDtos.ArmAutoSendRequest;
import com.householdledger.inventory.web.InventoryDtos.NoticeResponse;
import com.householdledger.inventory.web.InventoryDtos.PublicShareResponse;
import com.householdledger.inventory.web.InventoryDtos.ShareCreateRequest;
import com.householdledger.inventory.web.InventoryDtos.ShareResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class ShareService {
    private static final Logger log = LoggerFactory.getLogger(ShareService.class);

    private final ShareRepository shares;
    private final RecipientRepository recipients;
    private final OutboundNoticeRepository notices;
    private final UserRepository users;
    private final Optional<JavaMailSender> mailSender;
    private final String mailFrom;
    private final String publicBaseUrl;
    private final Duration shareTtl;

    public ShareService(
            ShareRepository shares,
            RecipientRepository recipients,
            OutboundNoticeRepository notices,
            UserRepository users,
            Optional<JavaMailSender> mailSender,
            @Value("${ledger.mail.from:noreply@localhost}") String mailFrom,
            @Value("${ledger.public-base-url:http://localhost:5173}") String publicBaseUrl,
            @Value("${ledger.share-ttl-days:90}") long shareTtlDays
    ) {
        this.shares = shares;
        this.recipients = recipients;
        this.notices = notices;
        this.users = users;
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.publicBaseUrl = publicBaseUrl;
        this.shareTtl = Duration.ofDays(shareTtlDays);
    }

    @Transactional
    public ShareResponse createManual(Long userId, ShareCreateRequest request) {
        User user = requireUser(userId);
        if (user.getSharingTier() == SharingTier.RECORD_ONLY) {
            throw ApiException.forbidden("TIER_FORBIDS_SHARE", "Record-only tier cannot create share links");
        }
        Share share = persistShare(userId, ShareKind.MANUAL, request.ciphertext(), request.nonce(), request.kdfSalt());
        return toShareResponse(share);
    }

    @Transactional
    public ShareResponse armAutoSend(Long userId, ArmAutoSendRequest request) {
        User user = requireUser(userId);
        if (user.getSharingTier() != SharingTier.AUTO_SEND) {
            throw ApiException.forbidden("TIER_FORBIDS_SHARE", "Switch to auto-send tier before arming");
        }
        if (recipients.countByUserId(userId) < 1) {
            throw ApiException.badRequest("NO_RECIPIENTS", "Add at least one recipient before arming auto-send");
        }
        user.setAutoBundleCiphertext(request.ciphertext());
        user.setAutoBundleNonce(request.nonce());
        user.setAutoBundleKdfSalt(request.kdfSalt());
        user.setAutoSendArmed(true);
        user.setAutoSendTriggeredAt(null);
        user.setLastCheckInAt(Instant.now());
        return new ShareResponse(null, ShareKind.AUTO, null, Instant.now(), null);
    }

    @Transactional
    public void disarm(Long userId) {
        User user = requireUser(userId);
        user.setAutoSendArmed(false);
    }

    @Transactional(readOnly = true)
    public PublicShareResponse getPublic(String token) {
        Share share = shares.findByPublicId(token).orElseThrow(() -> ApiException.notFound("Share not found"));
        if (share.getExpiresAt() != null && share.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.notFound("Share not found");
        }
        return new PublicShareResponse(
                share.getPublicId(),
                share.getShareKind(),
                share.getKdfSalt(),
                share.getCiphertext(),
                share.getNonce(),
                share.getExpiresAt(),
                share.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<ShareResponse> listMine(Long userId) {
        return shares.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toShareResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> notices(Long userId) {
        return notices.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(n -> new NoticeResponse(
                        n.getPublicId(),
                        n.getRecipientName(),
                        n.getRecipientEmail(),
                        n.getChannel(),
                        n.getStatus(),
                        n.getDetail(),
                        n.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public int processDueAutoSends() {
        List<User> due = users.findAll().stream()
                .filter(user -> user.getSharingTier() == SharingTier.AUTO_SEND)
                .filter(User::isAutoSendArmed)
                .filter(user -> user.getAutoSendTriggeredAt() == null)
                .filter(user -> user.getAutoBundleCiphertext() != null)
                .filter(user -> user.getLastCheckInAt()
                        .plus(user.getCheckInIntervalDays(), ChronoUnit.DAYS)
                        .isBefore(Instant.now()))
                .toList();
        int fired = 0;
        for (User user : due) {
            fireAutoSend(user);
            fired++;
        }
        return fired;
    }

    private void fireAutoSend(User user) {
        Share share = persistShare(user.getId(), ShareKind.AUTO, user.getAutoBundleCiphertext(), user.getAutoBundleNonce(), user.getAutoBundleKdfSalt());
        user.setAutoSendTriggeredAt(Instant.now());
        user.setAutoSendArmed(false);
        List<Recipient> list = recipients.findByUserIdOrderByCreatedAtAsc(user.getId());
        String path = retrievePath(share);
        for (Recipient recipient : list) {
            notifyRecipient(user, share, recipient, path);
        }
        log.info("Auto-send fired for user {} share {}", user.getPublicId(), share.getPublicId());
    }

    private void notifyRecipient(User user, Share share, Recipient recipient, String path) {
        OutboundNotice notice = new OutboundNotice();
        notice.setUserId(user.getId());
        notice.setShareId(share.getId());
        notice.setRecipientEmail(recipient.getEmail());
        notice.setRecipientName(recipient.getName());
        notice.setChannel("email");
        String body = """
                %s shared an encrypted household ledger bundle with you after a missed check-in.
                Retrieve the ciphertext (use the unlock phrase they gave you separately):
                %s%s
                """.formatted(user.getDisplayName(), publicBaseUrl, path);
        if (mailSender.isEmpty()) {
            notice.setStatus("LOGGED_NO_SMTP");
            notice.setDetail("SMTP is not configured; notice stored only. " + path);
            notices.save(notice);
            log.warn("No SMTP; would email {} link {}", recipient.getEmail(), path);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(recipient.getEmail());
            message.setSubject("Household ledger package from " + user.getDisplayName());
            message.setText(body);
            mailSender.get().send(message);
            notice.setStatus("SENT");
            notice.setDetail(path);
        } catch (Exception ex) {
            notice.setStatus("FAILED");
            notice.setDetail(ex.getMessage());
            log.error("Failed to email {}", recipient.getEmail(), ex);
        }
        notices.save(notice);
    }

    private Share persistShare(Long userId, ShareKind kind, String ciphertext, String nonce, String kdfSalt) {
        Share share = new Share();
        share.setUserId(userId);
        share.setShareKind(kind);
        share.setCiphertext(ciphertext);
        share.setNonce(nonce);
        share.setKdfSalt(kdfSalt);
        share.setExpiresAt(Instant.now().plus(shareTtl));
        shares.save(share);
        return share;
    }

    private User requireUser(Long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
    }

    private ShareResponse toShareResponse(Share share) {
        return new ShareResponse(
                share.getPublicId(),
                share.getShareKind(),
                share.getExpiresAt(),
                share.getCreatedAt(),
                retrievePath(share)
        );
    }

    private static String retrievePath(Share share) {
        return "/share/" + share.getPublicId();
    }
}
