package com.scms.service;

import com.scms.entity.CustomerProfile;
import com.scms.entity.TrustScoreHistory;
import com.scms.repository.CustomerProfileRepository;
import com.scms.repository.TrustScoreHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrustScoreService {

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private TrustScoreHistoryRepository trustScoreHistoryRepository;

    @Transactional
    public CustomerProfile updateTrustScore(String email, String eventType, String description) {
        CustomerProfile profile = customerProfileRepository.findByEmail(email).orElse(null);
        if (profile == null) return null;

        int change = 0;
        switch (eventType.toUpperCase()) {
            case "SUCCESSFUL_ORDER":
                change = +5;
                break;
            case "ONLINE_PAYMENT":
                change = +2;
                break;
            case "CUSTOMER_VERIFIED":
                change = +10;
                break;
            case "POSITIVE_REVIEW":
                change = +3;
                break;
            case "FAKE_ORDER":
                change = -15;
                break;
            case "FRAUD_REPORT":
                change = -20;
                break;
            case "COD_REJECTION":
                change = -10;
                break;
            default:
                change = 0;
        }

        int prevScore = profile.getTrustScore();
        int newScore = Math.max(0, Math.min(100, prevScore + change));

        profile.setTrustScore(newScore);
        customerProfileRepository.save(profile);

        TrustScoreHistory history = new TrustScoreHistory();
        history.setEmail(email);
        history.setEventType(eventType);
        history.setScoreChange(change);
        history.setPreviousScore(prevScore);
        history.setNewScore(newScore);
        history.setDescription(description != null ? description : "Trust Score event: " + eventType);
        trustScoreHistoryRepository.save(history);

        return profile;
    }
}
