package com.scms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.scms.entity.Manager;
import com.scms.repository.ManagerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ManagerService {

    @Autowired
    private ManagerRepository managerRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public List<Manager> getAllManagers() {
        return managerRepository.findAll();
    }

    public Manager getManagerById(int id) {
        return managerRepository.findById(id).orElse(null);
    }

    public Manager getManagerByEmail(String email) {
        return managerRepository.findByEmail(email);
    }

    public Manager addManager(Manager manager) {
        return managerRepository.save(manager);
    }

    /**
     * Registration flow: Validate OTP, encode password, activate account.
     * Subsequent updates: preserve existing BCrypt password unless a new plain password is provided.
     */
    public Manager updateManager(Manager manager) {
        Manager existing = managerRepository.findById(manager.getManagerId()).orElse(null);

        // Registration activation: PENDING → ACTIVE with OTP
        if (existing != null && "PENDING".equals(existing.getStatus()) && "ACTIVE".equals(manager.getStatus())) {
            if (manager.getOtp() == null || !otpService.verifyOtp(manager.getEmail(), manager.getOtp())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or Expired OTP");
            }
            otpService.deleteOtp(manager.getEmail());

            // Encode the plain password provided during registration
            if (manager.getPassword() != null && !manager.getPassword().isBlank()) {
                manager.setPassword(passwordEncoder.encode(manager.getPassword()));
            }
            // Mark OTP as used so it cannot be reused
            manager.setOtpStatus("USED");

            return managerRepository.save(manager);
        }

        // Normal update (not a registration activation)
        if (manager.getPassword() != null && !manager.getPassword().isBlank()) {
            // Only re-encode if the password is a new plain-text password
            // A BCrypt hash always starts with "$2a$", "$2b$", or "$2y$"
            boolean alreadyEncoded = manager.getPassword().startsWith("$2a$")
                || manager.getPassword().startsWith("$2b$")
                || manager.getPassword().startsWith("$2y$");

            if (!alreadyEncoded) {
                manager.setPassword(passwordEncoder.encode(manager.getPassword()));
            }
        } else if (existing != null) {
            // No password provided in update — keep the existing one
            manager.setPassword(existing.getPassword());
        }

        return managerRepository.save(manager);
    }

    /**
     * Login: supports both username and email as the login identifier.
     * Only ACTIVE managers can log in. Matches BCrypt-hashed passwords.
     */
    public Manager login(String usernameOrEmail, String password) {
        // Try by username first
        Manager manager = managerRepository.findByUsername(usernameOrEmail);

        // If not found by username, try by email
        if (manager == null) {
            manager = managerRepository.findByEmail(usernameOrEmail);
        }

        if (manager != null && "ACTIVE".equals(manager.getStatus())) {
            // Always try BCrypt match first, then plain-text fallback for legacy accounts
            if (passwordEncoder.matches(password, manager.getPassword())) {
                return manager;
            }
            // Plain-text fallback for pre-BCrypt accounts
            if (password.equals(manager.getPassword())) {
                // Upgrade to BCrypt on successful plain-text login
                manager.setPassword(passwordEncoder.encode(password));
                managerRepository.save(manager);
                return manager;
            }
        }
        return null;
    }

    public void deleteManager(int id) {
        managerRepository.deleteById(id);
    }
}