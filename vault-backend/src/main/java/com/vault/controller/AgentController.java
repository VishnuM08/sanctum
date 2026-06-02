package com.vault.controller;

import com.vault.dto.AgentDto;
import com.vault.entity.AgentLog;
import com.vault.entity.User;
import com.vault.repository.AgentLogRepository;
import com.vault.security.UserPrincipal;
import com.vault.service.UserService;
import com.vault.service.agent.AgentService;
import com.vault.service.agent.DigestBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
public class AgentController {

    private final AgentLogRepository agentLogRepository;
    private final UserService userService;
    private final DigestBuilder digestBuilder;
    private final AgentService agentService;

    @GetMapping("/logs")
    public ResponseEntity<List<AgentLog>> getAgentLogs(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(agentLogRepository.findByUserIdOrderByCreatedAtDesc(principal.id()));
    }

    @PostMapping("/digest")
    public ResponseEntity<?> getDailyDigest(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            User user = userService.findById(principal.id())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            String digest = digestBuilder.buildDigest(user);
            return ResponseEntity.ok().body(new DigestResponse(digest));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chatWithAgent(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody AgentDto.ChatRequest request) {
        try {
            User user = userService.findById(principal.id())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            String reply = agentService.chatWithAgent(user, request.getMessage());
            return ResponseEntity.ok().body(new AgentDto.ChatResponse(reply));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private static class DigestResponse {
        private final String digest;

        public DigestResponse(String digest) {
            this.digest = digest;
        }

        public String getDigest() {
            return digest;
        }
    }
}
