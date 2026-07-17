package com.example.ecomerce.controller;

import com.example.ecomerce.dto.CartRequest;
import com.example.ecomerce.entity.Cart;
import com.example.ecomerce.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
@CrossOrigin("*")
public class CartController {

    @Autowired
    private CartService cartService;

    @PostMapping
    public Cart addToCart(@RequestBody CartRequest request) {
        return cartService.addToCart(request);
    }

    @GetMapping("/{userId}")
    public List<Cart> getCart(@PathVariable Long userId) {
        return cartService.getCartByUser(userId);
    }

    @DeleteMapping("/{cartId}")
    public String removeCartItem(@PathVariable Long cartId) {
        cartService.removeCartItem(cartId);
        return "Item Removed Successfully";
    }
}