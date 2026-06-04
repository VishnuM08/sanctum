package com.vault.service;

import com.vault.dto.NoteDto;
import com.vault.entity.User;
import com.vault.entity.Note;
import com.vault.repository.NoteRepository;
import com.vault.service.agent.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    
    // Use Lazy initialization to avoid circular dependency since AgentService might inject NoteService
    @Lazy
    private final AgentService agentService;

    @Transactional
    public Note createNote(User user, NoteDto.NoteRequest request) {
        Note note = Note.builder()
                .id(UUID.randomUUID())
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .tags(new String[0])
                .archived(false)
                .build();

        note = noteRepository.save(note);

        // Fire-and-forget: agent extracts reminders, summary, tags
        agentService.processNoteAsync(note);

        return note;
    }

    @Transactional
    public Note updateNote(UUID userId, UUID id, NoteDto.NoteRequest request) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        if (!note.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        note.setTitle(request.getTitle());
        note.setContent(request.getContent());
        note.setArchived(false); // Make sure it's active

        note = noteRepository.save(note);

        // Re-process Note with Agent
        agentService.processNoteAsync(note);

        return note;
    }

    public List<Note> getUserNotes(UUID userId) {
        return noteRepository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(userId);
    }

    @Transactional
    public void deleteNote(UUID userId, UUID id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        if (!note.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        noteRepository.delete(note);
    }

    public Note findById(UUID id) {
        return noteRepository.findById(id).orElse(null);
    }
}
