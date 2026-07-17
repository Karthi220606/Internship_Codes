package com.example.ecomerce.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.example.ecomerce.entity.Product;
import com.example.ecomerce.repository.ProductRepository;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

   
    public ResponseEntity<?> addProduct(Product product) {

        if (productRepository.existsByNameAndCompanyName(
                product.getName(),
                product.getCompanyName())) {

            return ResponseEntity.badRequest().body("Product already exists in that seller name");
        }

        Product p=productRepository.save(product);
        return ResponseEntity.ok(p);
    }

   
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    
    public Product getProductById(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    
    public Product updateProduct(Long id, Product product) {

        Product existingProduct = productRepository.findById(id).orElse(null);

        if (existingProduct != null) {

            existingProduct.setName(product.getName());
            existingProduct.setDescription(product.getDescription());
            existingProduct.setPrice(product.getPrice());
            existingProduct.setStock(product.getStock());

            return productRepository.save(existingProduct);
        }

        return null;
    }

    
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

}