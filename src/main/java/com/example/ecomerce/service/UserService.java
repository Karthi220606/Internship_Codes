package com.example.ecomerce.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.example.ecomerce.entity.User;
import com.example.ecomerce.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    
    public ResponseEntity<?> registerUser(User user) {
    	if(userRepository.existsByEmail(user.getEmail())) {
    		return ResponseEntity.badRequest().body("User Already exist in their email");
    	}
        User u=userRepository.save(user);
        return ResponseEntity.ok(u);
    }

    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    
    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    
    public User updateUser(Long id, User user) {

        User existingUser = userRepository.findById(id).orElse(null);

        if (existingUser != null) {
            existingUser.setName(user.getName());
            existingUser.setEmail(user.getEmail());
            existingUser.setPassword(user.getPassword());

            return userRepository.save(existingUser);
        }

        return null;
    }

    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

}
