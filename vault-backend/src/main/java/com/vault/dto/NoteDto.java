package com.vault.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class NoteDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NoteRequest {
        private String title;
        private String content;
    }
}
