package com.vault.service;

import com.vault.dto.ReminderDto;
import com.vault.entity.User;
import com.vault.entity.Reminder;
import com.vault.entity.Note;
import com.vault.repository.ReminderRepository;
import com.vault.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final NoteRepository noteRepository;

    @Transactional
    public Reminder createReminder(User user, ReminderDto.ReminderRequest request) {
        Note note = null;
        if (request.getNoteId() != null) {
            note = noteRepository.findById(request.getNoteId()).orElse(null);
        }

        Reminder reminder = Reminder.builder()
                .user(user)
                .note(note)
                .title(request.getTitle())
                .context(request.getContext())
                .remindAt(request.getRemindAt())
                .fired(false)
                .aiGenerated(false)
                .build();

        return reminderRepository.save(reminder);
    }

    public List<Reminder> getUserReminders(UUID userId) {
        return reminderRepository.findByUserIdOrderByRemindAtAsc(userId);
    }

    @Transactional
    public Reminder completeReminder(UUID userId, UUID id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));

        if (!reminder.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        reminder.setFired(true);
        return reminderRepository.save(reminder);
    }

    @Transactional
    public void deleteReminder(UUID userId, UUID id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));

        if (!reminder.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        reminderRepository.delete(reminder);
    }
}
