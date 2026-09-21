package com.scms.repository;

import com.scms.entity.SyncLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface SyncLockRepository extends JpaRepository<SyncLock, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SyncLock s where s.id = :id")
    Optional<SyncLock> findByIdForUpdate(@Param("id") String id);
}
