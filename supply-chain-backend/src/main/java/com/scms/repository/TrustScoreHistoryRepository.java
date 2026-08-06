package com.scms.repository;

import com.scms.entity.TrustScoreHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrustScoreHistoryRepository extends JpaRepository<TrustScoreHistory, Long> {
    List<TrustScoreHistory> findByEmailOrderByCreatedAtDesc(String email);
}
