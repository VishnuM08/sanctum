package com.vault.controller;

import com.vault.dto.ReminderDto;
import com.vault.entity.Reminder;
import com.vault.entity.User;
import com.vault.security.UserPrincipal;
import com.vault.service.ReminderService;
import com.vault.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Reminder>> getReminders(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reminderService.getUserReminders(principal.id()));
    }

    @PostMapping
    public ResponseEntity<?> createReminder(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ReminderDto.ReminderRequest request) {
        try {
            User user = userService.findById(principal.id())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Reminder reminder = reminderService.createReminder(user, request);
            return ResponseEntity.ok(reminder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeReminder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        try {
            Reminder reminder = reminderService.completeReminder(principal.id(), id);
            return ResponseEntity.ok(reminder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReminder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        try {
            reminderService.deleteReminder(principal.id(), id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
