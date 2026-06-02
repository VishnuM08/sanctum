package com.vault.repository;

import com.vault.entity.VaultEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface VaultEntryRepository extends JpaRepository<VaultEntry, UUID> {
    List<VaultEntry> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
