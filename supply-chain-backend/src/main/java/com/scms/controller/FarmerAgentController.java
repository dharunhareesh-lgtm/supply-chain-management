package com.scms.controller;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.scms.agent.*;

/**
 * Controller exposing the single unified DRAVIX Farmer Agent endpoint.
 */
@RestController
@RequestMapping("/api/agent")
@CrossOrigin(origins = "*")
public class FarmerAgentController {

    @Autowired
    private FarmerAgentService agentService;

    public static class AgentChatRequest {
        private String message;
        private FarmerContext context;
        private List<Map<String, String>> sessionHistory;

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public FarmerContext getContext() { return context; }
        public void setContext(FarmerContext context) { this.context = context; }

        public List<Map<String, String>> getSessionHistory() { return sessionHistory; }
        public void setSessionHistory(List<Map<String, String>> sessionHistory) { this.sessionHistory = sessionHistory; }
    }

    @PostMapping("/chat")
    public ResponseEntity<ActionResult> handleChat(@RequestBody AgentChatRequest request) {
        String msg = request.getMessage() != null ? request.getMessage() : "";
        FarmerContext ctx = request.getContext() != null ? request.getContext() : new FarmerContext();
        List<Map<String, String>> history = request.getSessionHistory() != null ? request.getSessionHistory() : Collections.emptyList();

        ActionResult result = agentService.processMessage(msg, ctx, history);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/actions")
    public ResponseEntity<Map<ActionType, FarmerActionRegistry.ActionDefinition>> listRegisteredActions() {
        return ResponseEntity.ok(agentService.getRegisteredActions());
    }
}
