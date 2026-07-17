package com.example.ecomerce.repository;

import com.example.ecomerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

	 boolean existsByNameAndCompanyName(String name, String companyName);

	

	

}
