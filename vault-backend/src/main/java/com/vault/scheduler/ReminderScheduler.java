package com.vault.scheduler;

import com.vault.entity.Reminder;
import com.vault.entity.User;
import com.vault.repository.ReminderRepository;
import com.vault.repository.UserRepository;
import com.vault.service.NotificationService;
import com.vault.service.agent.DigestBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final DigestBuilder digestBuilder;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void fireReminders() {
        log.debug("ReminderScheduler: Checking for due reminders...");
        Instant now = Instant.now();
        List<Reminder> dueReminders = reminderRepository.findByFiredFalseAndRemindAtBefore(now);

        for (Reminder r : dueReminders) {
            try {
                notificationService.send(r.getUser(), r.getTitle(), r.getContext());
                r.setFired(true);
                reminderRepository.save(r);
                log.info("Reminder fired successfully: ID={}, Title='{}'", r.getId(), r.getTitle());
            } catch (Exception e) {
                log.error("Failed to fire reminder: ID={}", r.getId(), e);
            }
        }
    }

    @Scheduled(cron = "0 0 7 * * *")
    public void sendMorningDigest() {
        log.info("ReminderScheduler: Generating morning digests for all users...");
        List<User> users = userRepository.findAll();
        for (User user : users) {
            try {
                String digest = digestBuilder.buildDigest(user);
                notificationService.sendDailyDigest(user, digest);
                log.info("Sent morning digest to user: {}", user.getEmail());
            } catch (Exception e) {
                log.error("Failed to build/send morning digest for: {}", user.getEmail(), e);
            }
        }
    }
}
