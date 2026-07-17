package com.scms.repository;

import com.scms.entity.PackagingStandard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PackagingStandardRepository extends JpaRepository<PackagingStandard, Integer> {
    List<PackagingStandard> findByActive(boolean active);
    PackagingStandard findBySize(int size);
}
