package com.scms.repository;

import com.scms.entity.WarehouseModelMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WarehouseModelMetadataRepository extends JpaRepository<WarehouseModelMetadata, Long> {
    Optional<WarehouseModelMetadata> findFirstByStatusOrderByLastTrainingDateDesc(String status);
}
