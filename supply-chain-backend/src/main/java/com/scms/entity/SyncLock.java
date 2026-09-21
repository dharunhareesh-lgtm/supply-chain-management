package com.scms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sync_locks")
public class SyncLock {

    @Id
    private String id; // e.g. "OGD_SYNC_LOCK"

    @Column(name = "locked_by", nullable = false)
    private String lockedBy; // Unique JVM identifier

    @Column(name = "locked_at", nullable = false)
    private LocalDateTime lockedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    public SyncLock() {
    }

    public SyncLock(String id, String lockedBy, LocalDateTime lockedAt, LocalDateTime expiresAt) {
        this.id = id;
        this.lockedBy = lockedBy;
        this.lockedAt = lockedAt;
        this.expiresAt = expiresAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLockedBy() {
        return lockedBy;
    }

    public void setLockedBy(String lockedBy) {
        this.lockedBy = lockedBy;
    }

    public LocalDateTime getLockedAt() {
        return lockedAt;
    }

    public void setLockedAt(LocalDateTime lockedAt) {
        this.lockedAt = lockedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
