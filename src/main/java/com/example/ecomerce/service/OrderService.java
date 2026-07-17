package com.example.ecomerce.service;

import com.example.ecomerce.dto.OrderRequest;
import com.example.ecomerce.entity.Order;
import com.example.ecomerce.entity.Product;
import com.example.ecomerce.entity.User;
import com.example.ecomerce.repository.OrderRepository;
import com.example.ecomerce.repository.ProductRepository;
import com.example.ecomerce.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

	@Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    
    public Order placeOrder(OrderRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product Not Found"));

        Order order = new Order();

        order.setUser(user);
        order.setProduct(product);
        order.setQuantity(request.getQuantity());

        
        order.setTotalPrice(product.getPrice() * request.getQuantity());

        
        order.setOrderDate(LocalDateTime.now());

        return orderRepository.save(order);
    }

    public List<Order> getOrderHistory(Long userId) {
        return orderRepository.findByUserId(userId);
    }

  
    public Order getOrderById(Long id) {
        return orderRepository.findById(id).orElse(null);
    }

   
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }
}
