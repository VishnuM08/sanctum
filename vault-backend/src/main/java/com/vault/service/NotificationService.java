package com.vault.service;

import com.vault.entity.User;
import com.vault.entity.AgentLog;
import com.vault.repository.AgentLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final AgentLogRepository agentLogRepository;

    @Transactional
    public void send(User user, String title, String context) {
        log.info("SENDING NOTIFICATION to {}: Title: '{}', Context: '{}'", user.getEmail(), title, context);

        AgentLog agentLog = AgentLog.builder()
                .user(user)
                .action("REMINDER_FIRED")
                .payload("Fired reminder: \"" + title + "\"" + (context != null ? " | Context: " + context : ""))
                .build();
        agentLogRepository.save(agentLog);
    }

    @Transactional
    public void sendDailyDigest(User user, String digestContent) {
        log.info("SENDING DAILY DIGEST to {}:\n{}", user.getEmail(), digestContent);

        AgentLog agentLog = AgentLog.builder()
                .user(user)
                .action("DIGEST_SENT")
                .payload("Sent morning digest. Actions: " + digestContent)
                .build();
        agentLogRepository.save(agentLog);
    }
}
