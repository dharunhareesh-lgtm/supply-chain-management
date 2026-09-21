package com.scms.repository;

import com.scms.entity.LandRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LandRecordRepository extends JpaRepository<LandRecord, Long> {
    List<LandRecord> findByVerificationStatus(String status);
    Optional<LandRecord> findBySurveyNumberAndVillageAndTalukAndDistrict(String surveyNumber, String village, String taluk, String district);
}
