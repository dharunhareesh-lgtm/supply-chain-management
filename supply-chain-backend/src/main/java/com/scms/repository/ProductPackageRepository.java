package com.scms.repository;

import com.scms.entity.ProductPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductPackageRepository extends JpaRepository<ProductPackage, Integer> {
    List<ProductPackage> findByProductId(int productId);
    ProductPackage findByProductIdAndPackageSize(int productId, int packageSize);
    void deleteByProductId(int productId);
}
