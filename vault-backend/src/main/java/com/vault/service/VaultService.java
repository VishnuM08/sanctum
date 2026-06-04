package com.vault.service;

import com.vault.dto.VaultDto;
import com.vault.entity.User;
import com.vault.entity.VaultEntry;
import com.vault.repository.VaultEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VaultService {

    private final VaultEntryRepository vaultEntryRepository;
    private final VaultEncryptionService encryptionService;

    @Transactional
    public VaultEntry createEntry(User user, VaultDto.VaultRequest request) {
        String encrypted = encryptionService.encrypt(request.getValue());

        VaultEntry entry = VaultEntry.builder()
                .id(UUID.randomUUID())
                .user(user)
                .title(request.getTitle())
                .type(request.getType())
                .encryptedValue(encrypted)
                .expiresAt(request.getExpiresAt())
                .build();

        return vaultEntryRepository.save(entry);
    }

    public List<VaultEntry> getUserEntries(UUID userId) {
        List<VaultEntry> entries = vaultEntryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        // Decrypt values before returning to authenticated client
        return entries.stream().map(entry -> {
            String decrypted = encryptionService.decrypt(entry.getEncryptedValue());
            entry.setEncryptedValue(decrypted);
            return entry;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void deleteEntry(UUID userId, UUID id) {
        VaultEntry entry = vaultEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vault item not found"));

        if (!entry.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        vaultEntryRepository.delete(entry);
    }
}
