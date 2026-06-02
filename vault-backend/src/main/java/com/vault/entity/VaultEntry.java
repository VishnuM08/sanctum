package com.vault.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vault_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VaultEntry {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "label", nullable = false)
    private String title;

    @Column(name = "encrypted_value", nullable = false, length = 1000)
    private String encryptedValue;

    @Column(name = "category", nullable = false, length = 50)
    private String type; // password, card, contact, note

    @Column(name = "expires_at")
    private Instant expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
    }
}
