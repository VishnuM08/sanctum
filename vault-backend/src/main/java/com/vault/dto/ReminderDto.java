package com.vault.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

public class ReminderDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReminderRequest {
        private String title;
        private Instant remindAt;
        private String context;
        private UUID noteId;
    }
}
