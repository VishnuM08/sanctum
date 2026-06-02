package com.vault.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

public class VaultDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VaultRequest {
        private String title;
        private String type; // password, card, contact, note
        private String value;
        private Instant expiresAt;
    }
}
