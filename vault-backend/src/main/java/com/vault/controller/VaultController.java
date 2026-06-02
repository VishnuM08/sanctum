package com.vault.controller;

import com.vault.dto.VaultDto;
import com.vault.entity.User;
import com.vault.entity.VaultEntry;
import com.vault.security.UserPrincipal;
import com.vault.service.UserService;
import com.vault.service.VaultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vault")
@RequiredArgsConstructor
public class VaultController {

    private final VaultService vaultService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<VaultEntry>> getVaultEntries(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(vaultService.getUserEntries(principal.id()));
    }

    @PostMapping
    public ResponseEntity<?> createVaultEntry(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody VaultDto.VaultRequest request) {
        try {
            User user = userService.findById(principal.id())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            VaultEntry entry = vaultService.createEntry(user, request);
            return ResponseEntity.ok(entry);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVaultEntry(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        try {
            vaultService.deleteEntry(principal.id(), id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
