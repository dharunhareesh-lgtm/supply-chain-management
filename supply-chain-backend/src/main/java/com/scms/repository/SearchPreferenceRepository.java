package com.scms.repository;

import com.scms.entity.SearchPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SearchPreferenceRepository extends JpaRepository<SearchPreference, Long> {
    Optional<SearchPreference> findByEmail(String email);
}
