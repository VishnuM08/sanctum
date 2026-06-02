package com.vault.security;

import java.util.UUID;

public record UserPrincipal(UUID id, String email) {}
