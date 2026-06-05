package com.vault.repository;

import com.vault.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {
    List<Reminder> findByUserIdOrderByRemindAtAsc(UUID userId);
    List<Reminder> findByUserIdAndFiredFalseOrderByRemindAtAsc(UUID userId);
    List<Reminder> findByFiredFalseAndRemindAtBefore(Instant time);

    @Modifying
    @Transactional
    @Query("DELETE FROM Reminder r WHERE r.note.id = :noteId")
    void deleteByNoteId(@Param("noteId") UUID noteId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Reminder r WHERE r.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}

