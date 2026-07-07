package org.example;

class OrderService {

    public void checkout(
            PaymentProcessor processor,
            double amount
    ) {
        processor.processPayment(amount);
    }
}
