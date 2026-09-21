package com.scms.agent;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe memory manager for pending product updates awaiting explicit farmer confirmation.
 */
@Component
public class PendingProductUpdateManager {

    private final Map<String, PendingProductUpdate> pendingUpdates = new ConcurrentHashMap<>();

    private String buildKey(Integer supplierId, String username) {
        if (supplierId != null) return "sup-" + supplierId;
        if (username != null && !username.isBlank()) return "user-" + username;
        return "default-session";
    }

    public PendingProductUpdate getPendingUpdate(Integer supplierId, String username) {
        String key = buildKey(supplierId, username);
        return pendingUpdates.get(key);
    }

    public void savePendingUpdate(Integer supplierId, String username, PendingProductUpdate update) {
        String key = buildKey(supplierId, username);
        pendingUpdates.put(key, update);
    }

    public void clearPendingUpdate(Integer supplierId, String username) {
        String key = buildKey(supplierId, username);
        pendingUpdates.remove(key);
    }

    public boolean hasPendingUpdate(Integer supplierId, String username) {
        String key = buildKey(supplierId, username);
        return pendingUpdates.containsKey(key);
    }
}
