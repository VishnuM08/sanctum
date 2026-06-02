package com.vault.repository;

import com.vault.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {
    List<Reminder> findByUserIdOrderByRemindAtAsc(UUID userId);
    List<Reminder> findByUserIdAndFiredFalseOrderByRemindAtAsc(UUID userId);
    List<Reminder> findByFiredFalseAndRemindAtBefore(Instant time);
}
