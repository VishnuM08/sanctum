package com.vault.service.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vault.service.agent.IntentExtractorDto.IntentResult;
import com.vault.service.agent.IntentExtractorDto.ReminderExtraction;
import com.vault.service.agent.IntentExtractorDto.OllamaRequest;
import com.vault.service.agent.IntentExtractorDto.OllamaResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntentExtractor {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ollama.host:http://localhost:11434}")
    private String ollamaHost;

    @Value("${ollama.model:llama3.2}")
    private String ollamaModel;

    public IntentResult extract(String noteContent) {
        String prompt = """
            Analyze this note and extract:
            1. Any reminders or deadlines. For each reminder, extract:
               - "title": a short action-oriented task (e.g. "Call Mom", "Pay electricity bill")
               - "remind_at": the ISO 8601 date-time string when this reminder should fire. If the time is relative (e.g. "tomorrow", "this weekend"), calculate the ISO date relative to CURRENT_TIME: """ 
            + Instant.now().toString() + """
            .
            2. A 1-sentence summary ("summary").
            3. Suggested tags ("tags", max 3 tags).

            Respond ONLY in JSON format matching this schema:
            {
              "reminders": [
                {
                  "title": "task title",
                  "remind_at": "YYYY-MM-DDTHH:mm:SSZ"
                }
              ],
              "summary": "1-sentence summary",
              "tags": ["tag1", "tag2"]
            }

            Note Content:
            """ + noteContent;

        try {
            String url = ollamaHost + "/api/generate";
            OllamaRequest request = new OllamaRequest(ollamaModel, prompt, false, "json");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<OllamaRequest> entity = new HttpEntity<>(request, headers);

            log.info("Sending request to Ollama at: {}", url);
            OllamaResponse response = restTemplate.postForObject(url, entity, OllamaResponse.class);

            if (response != null && response.getResponse() != null) {
                log.info("Ollama response: {}", response.getResponse());
                return objectMapper.readValue(response.getResponse(), IntentResult.class);
            }
        } catch (Exception e) {
            log.warn("Ollama extraction failed or unreachable (Error: {}). Running regex-based heuristic fallback.", e.getMessage());
        }

        return runFallback(noteContent);
    }

    private IntentResult runFallback(String content) {
        String lower = content.toLowerCase();
        List<String> tags = new ArrayList<>();
        
        if (lower.contains("meeting") || lower.contains("work") || lower.contains("office")) tags.add("work");
        if (lower.contains("project") || lower.contains("code") || lower.contains("app")) tags.add("tech");
        if (lower.contains("grocery") || lower.contains("shopping") || lower.contains("buy")) tags.add("shopping");
        if (lower.contains("personal") || lower.contains("family") || lower.contains("home")) tags.add("personal");
        if (lower.contains("workout") || lower.contains("exercise") || lower.contains("gym")) tags.add("health");
        if (lower.contains("travel") || lower.contains("trip") || lower.contains("flight")) tags.add("travel");
        if (tags.isEmpty()) tags.add("notes");

        List<ReminderExtraction> reminders = new ArrayList<>();
        
        // Extract call intent
        if (lower.contains("call")) {
            String who = "someone";
            Matcher m = Pattern.compile("call ([a-zA-Z]+)", Pattern.CASE_INSENSITIVE).matcher(content);
            if (m.find() && !m.group(1).equalsIgnoreCase("me")) {
                who = m.group(1);
            }
            
            Instant remindAt = Instant.now().plus(1, ChronoUnit.DAYS); // default to tomorrow
            if (lower.contains("weekend")) {
                remindAt = Instant.now().plus(2, ChronoUnit.DAYS); // default estimation
            }
            reminders.add(new ReminderExtraction("Call " + who, remindAt.toString()));
        }
        
        // Extract follow up intent
        if (lower.contains("follow up") || lower.contains("followup")) {
            String who = "someone";
            Matcher m = Pattern.compile("follow up (?:with )?([a-zA-Z]+)", Pattern.CASE_INSENSITIVE).matcher(content);
            if (m.find()) who = m.group(1);
            reminders.add(new ReminderExtraction("Follow up with " + who, Instant.now().plus(1, ChronoUnit.DAYS).toString()));
        }
        
        // Extract appointments
        if (lower.contains("dentist") || lower.contains("doctor") || lower.contains("appointment")) {
            reminders.add(new ReminderExtraction("Appointment reminder", Instant.now().plus(3, ChronoUnit.DAYS).toString()));
        }

        String summary = content.length() > 60 ? content.substring(0, 57) + "..." : content;
        return new IntentResult(reminders, "Auto-summary: " + summary, tags);
    }
}
