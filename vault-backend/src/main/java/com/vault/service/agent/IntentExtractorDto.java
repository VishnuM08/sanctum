package com.vault.service.agent;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

public class IntentExtractorDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntentResult {
        private List<ReminderExtraction> reminders;
        private String summary;
        private List<String> tags;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReminderExtraction {
        private String title;
        private String remindAt; // ISO 8601 representation
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OllamaRequest {
        private String model;
        private String prompt;
        private boolean stream;
        private String format;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OllamaResponse {
        private String response;
    }
}
