package com.scms.agent.form;

import org.springframework.stereotype.Component;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * Thread-safe memory manager for active dynamic form filling sessions.
 */
@Component
public class FormSessionManager {

    private final Map<String, FormExecutionSession> sessions = new ConcurrentHashMap<>();

    private String buildKey(Integer supplierId, String username) {
        if (supplierId != null) return "sup-" + supplierId;
        if (username != null && !username.isBlank()) return "user-" + username;
        return "default-session";
    }

    public FormExecutionSession getSession(Integer supplierId, String username) {
        String key = buildKey(supplierId, username);
        FormExecutionSession session = sessions.get(key);
        if (session != null) {
            // Expire after 15 minutes of inactivity
            if (System.currentTimeMillis() - session.getLastActiveTime() > 15 * 60 * 1000) {
                sessions.remove(key);
                return null;
            }
            session.touch();
        }
        return session;
    }

    public void saveSession(Integer supplierId, String username, FormExecutionSession session) {
        String key = buildKey(supplierId, username);
        session.touch();
        sessions.put(key, session);
    }

    public void clearSession(Integer supplierId, String username) {
        String key = buildKey(supplierId, username);
        sessions.remove(key);
    }
}
