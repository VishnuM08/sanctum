package com.vault.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AgentDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        private String reply;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateRequest {
        private String prompt;
        private String systemPrompt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateResponse {
        private String result;
    }
}
