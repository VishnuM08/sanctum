package com.vault.repository;

import com.vault.entity.AgentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AgentLogRepository extends JpaRepository<AgentLog, UUID> {
    List<AgentLog> findByUserIdOrderByCreatedAtDesc(UUID userId);
    void deleteByUserId(UUID userId);
}
