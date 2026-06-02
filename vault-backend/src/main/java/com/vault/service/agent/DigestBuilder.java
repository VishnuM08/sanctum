package com.vault.service.agent;

import com.vault.entity.User;
import com.vault.entity.Reminder;
import com.vault.entity.Note;
import com.vault.repository.ReminderRepository;
import com.vault.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DigestBuilder {

    private final ReminderRepository reminderRepository;
    private final NoteRepository noteRepository;

    public String buildDigest(User user) {
        List<Reminder> activeReminders = reminderRepository.findByUserIdAndFiredFalseOrderByRemindAtAsc(user.getId());
        List<Note> activeNotes = noteRepository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(user.getId());

        StringBuilder sb = new StringBuilder();
        sb.append("Good morning, ").append(user.getName()).append("!\n\n");
        sb.append("Here is your Personal Vault digest for today:\n\n");

        if (activeReminders.isEmpty()) {
            sb.append("- You have no upcoming reminders scheduled.\n");
        } else {
            sb.append("- Upcoming Reminders:\n");
            int limit = Math.min(activeReminders.size(), 3);
            for (int i = 0; i < limit; i++) {
                Reminder r = activeReminders.get(i);
                sb.append("  * ").append(r.getTitle()).append(" (scheduled for ").append(r.getRemindAt().toString()).append(")\n");
            }
        }

        sb.append("\n");

        if (activeNotes.isEmpty()) {
            sb.append("- You have no active notes stored.\n");
        } else {
            sb.append("- Recent Notes:\n");
            int limit = Math.min(activeNotes.size(), 2);
            for (int i = 0; i < limit; i++) {
                Note n = activeNotes.get(i);
                sb.append("  * ").append(n.getTitle());
                if (n.getAiSummary() != null) {
                    sb.append(" (Summary: ").append(n.getAiSummary()).append(")");
                }
                sb.append("\n");
            }
        }

        sb.append("\nHave a great and secure day!");
        return sb.toString();
    }
}
