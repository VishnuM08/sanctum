package com.vault.service.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vault.entity.User;
import com.vault.entity.Note;
import com.vault.entity.Reminder;
import com.vault.entity.AgentLog;
import com.vault.repository.NoteRepository;
import com.vault.repository.ReminderRepository;
import com.vault.repository.AgentLogRepository;
import com.vault.service.agent.IntentExtractorDto.IntentResult;
import com.vault.service.agent.IntentExtractorDto.OllamaRequest;
import com.vault.service.agent.IntentExtractorDto.OllamaResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentService {

    private final IntentExtractor intentExtractor;
    private final NoteRepository noteRepository;
    private final ReminderRepository reminderRepository;
    private final AgentLogRepository agentLogRepository;
    private final RestTemplate restTemplate;

    @Value("${ollama.host:http://localhost:11434}")
    private String ollamaHost;

    @Value("${ollama.model:llama3.2}")
    private String ollamaModel;

    @Async
    @Transactional
    public void processNoteAsync(Note note) {
        log.info("Async agent processing started for note: {}", note.getTitle());
        try {
            // Call AI Extractor
            IntentResult intent = intentExtractor.extract(note.getContent());

            // Save AI findings to the note
            note.setAiSummary(intent.getSummary());
            if (intent.getTags() != null) {
                note.setTags(intent.getTags().toArray(new String[0]));
            }
            noteRepository.save(note);

            // Log note analysis
            AgentLog noteLog = AgentLog.builder()
                    .user(note.getUser())
                    .action("NOTE_ANALYZED")
                    .payload("Analyzed note \"" + note.getTitle() + "\": generated summary and tags.")
                    .build();
            agentLogRepository.save(noteLog);

            // Save extracted reminders
            if (intent.getReminders() != null) {
                intent.getReminders().forEach(r -> {
                    try {
                        Instant remindAt = Instant.parse(r.getRemindAt());
                        
                        Reminder reminder = Reminder.builder()
                                .user(note.getUser())
                                .note(note)
                                .title(r.getTitle())
                                .context("Auto-extracted from note: " + note.getTitle())
                                .remindAt(remindAt)
                                .aiGenerated(true)
                                .fired(false)
                                .build();
                        
                        reminderRepository.save(reminder);

                        // Log reminder extraction
                        AgentLog reminderLog = AgentLog.builder()
                                .user(note.getUser())
                                .action("REMINDER_EXTRACTED")
                                .payload("Extracted reminder: \"" + r.getTitle() + "\" for " + remindAt.toString())
                                .build();
                        agentLogRepository.save(reminderLog);
                    } catch (Exception ex) {
                        log.warn("Failed to parse extracted reminder date: {}", r.getRemindAt());
                    }
                });
            }

            log.info("Async agent processing completed successfully for note: {}", note.getTitle());

        } catch (Exception e) {
            log.error("Async agent processing failed for note: {}", note.getTitle(), e);
            try {
                AgentLog failLog = AgentLog.builder()
                        .user(note.getUser())
                        .action("AGENT_PROCESSING_FAILED")
                        .payload("Failed to process note \"" + note.getTitle() + "\": " + e.getMessage())
                        .build();
                agentLogRepository.save(failLog);
            } catch (Exception logEx) {
                log.error("Failed to write failure agent log", logEx);
            }
        }
    }

    @Transactional
    public String chatWithAgent(User user, String userMessage) {
        log.info("Agent RAG chat request from user: {}", user.getEmail());
        
        // 1. Gather user context (Notes & Reminders)
        List<Note> activeNotes = noteRepository.findByUserIdAndArchivedFalseOrderByUpdatedAtDesc(user.getId());
        List<Reminder> activeReminders = reminderRepository.findByUserIdAndFiredFalseOrderByRemindAtAsc(user.getId());

        StringBuilder context = new StringBuilder();
        context.append("USER NOTES (Most Recent):\n");
        int count = 0;
        for (Note n : activeNotes) {
            if (count >= 5) break;
            context.append("- Title: ").append(n.getTitle()).append("\n");
            
            // Prefer AI Summary if it exists, otherwise use truncated content
            if (n.getAiSummary() != null && !n.getAiSummary().isBlank()) {
                context.append("  Summary: ").append(n.getAiSummary()).append("\n");
            } else {
                String content = n.getContent();
                if (content != null && content.length() > 300) {
                    content = content.substring(0, 300) + "...";
                }
                context.append("  Content: ").append(content).append("\n");
            }
            count++;
        }
        
        context.append("\nACTIVE REMINDERS:\n");
        int rCount = 0;
        for (Reminder r : activeReminders) {
            if (rCount >= 10) break;
            context.append("- ").append(r.getTitle()).append(" (scheduled for ").append(r.getRemindAt().toString()).append(")\n");
            rCount++;
        }

        // 2. Build RAG prompt
        String prompt = "You are a helpful, secure, and intelligent AI personal agent for the application 'Personal Vault'. " +
                "You assist the user by answering questions based on their notes and reminders context. " +
                "Here is the user's data context:\n\n" +
                context.toString() + "\n\n" +
                "User Message: " + userMessage + "\n\n" +
                "Answer the user's message concisely, professionally, and helpfully based on the context above. If they ask about something not in the context, help them normally but mention you have no record of it in their vault.";

        String reply = "I can see you have " + activeNotes.size() + " active notes and " + activeReminders.size() + " reminders. How can I help you organize them?";
        
        try {
            String url = ollamaHost + "/api/generate";
            OllamaRequest request = new OllamaRequest(ollamaModel, prompt, false, null); // text response

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<OllamaRequest> entity = new HttpEntity<>(request, headers);

            OllamaResponse response = restTemplate.postForObject(url, entity, OllamaResponse.class);

            if (response != null && response.getResponse() != null) {
                reply = response.getResponse().trim();
            }
        } catch (Exception e) {
            log.warn("Ollama chat query failed: {}. Running regex-based heuristic fallback.", e.getMessage());
            
            // Regex matching fallback
            String lower = userMessage.toLowerCase();
            if (lower.contains("note") || lower.contains("summar")) {
                if (activeNotes.isEmpty()) {
                    reply = "You don't have any notes in your vault yet. Create one, and I'll analyze it!";
                } else {
                    reply = "You have " + activeNotes.size() + " active notes. Your latest notes are: " +
                            activeNotes.stream().map(Note::getTitle).limit(3).collect(Collectors.joining(", "));
                }
            } else if (lower.contains("reminder")) {
                if (activeReminders.isEmpty()) {
                    reply = "You have no active reminders right now. Write something like 'call mom tomorrow' in a note, and I will extract it.";
                } else {
                    reply = "You have " + activeReminders.size() + " active reminders. The next scheduled task is \"" +
                            activeReminders.get(0).getTitle() + "\" set for " + activeReminders.get(0).getRemindAt().toString();
                }
            }
        }

        // Log the action
        AgentLog chatLog = AgentLog.builder()
                .user(user)
                .action("AGENT_CHAT")
                .payload("User asked: \"" + userMessage + "\" | Reply: \"" + (reply.length() > 60 ? reply.substring(0, 57) + "..." : reply) + "\"")
                .build();
        agentLogRepository.save(chatLog);

        return reply;
    }

    public String generateText(String prompt, String systemPrompt) {
        String fullPrompt = (systemPrompt != null ? systemPrompt + "\n\n" : "") + prompt;
        try {
            String url = ollamaHost + "/api/generate";
            OllamaRequest request = new OllamaRequest(ollamaModel, fullPrompt, false, null);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<OllamaRequest> entity = new HttpEntity<>(request, headers);

            OllamaResponse response = restTemplate.postForObject(url, entity, OllamaResponse.class);

            if (response != null && response.getResponse() != null) {
                return response.getResponse().trim();
            }
        } catch (Exception e) {
            log.error("Ollama general text generation failed: {}", e.getMessage());
            throw new RuntimeException("Ollama service error: " + e.getMessage());
        }
        return "No response from local AI.";
    }
}
