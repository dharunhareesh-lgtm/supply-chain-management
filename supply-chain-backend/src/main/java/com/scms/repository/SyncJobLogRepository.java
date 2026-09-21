package com.scms.repository;

import com.scms.entity.SyncJobLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SyncJobLogRepository extends JpaRepository<SyncJobLog, Long> {

    List<SyncJobLog> findByJobNameOrderByStartedAtDesc(String jobName);

    // Find the latest successful job completed after a specific time
    SyncJobLog findFirstByJobNameAndStatusAndCompletedAtGreaterThanEqualOrderByCompletedAtDesc(
            String jobName, String status, LocalDateTime completedAt);
}
