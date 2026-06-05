package com.vault.controller;

import com.vault.dto.NoteDto;
import com.vault.entity.Note;
import com.vault.entity.User;
import com.vault.security.UserPrincipal;
import com.vault.service.NoteService;
import com.vault.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Note>> getNotes(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(noteService.getUserNotes(principal.id()));
    }

    @PostMapping
    public ResponseEntity<?> createNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody NoteDto.NoteRequest request) {
        try {
            User user = userService.findById(principal.id())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Note note = noteService.createNote(user, request);
            return ResponseEntity.ok(note);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody NoteDto.NoteRequest request) {
        try {
            Note note = noteService.updateNote(principal.id(), id, request);
            return ResponseEntity.ok(note);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        try {
            noteService.deleteNote(principal.id(), id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping
    public ResponseEntity<?> deleteAllNotes(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            noteService.deleteAllUserNotes(principal.id());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
