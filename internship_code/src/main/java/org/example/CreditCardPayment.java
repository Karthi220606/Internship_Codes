package org.example;



public class CreditCardPayment extends Payment {

    public CreditCardPayment(String transactionId) {
        super(transactionId);
    }

    @Override
    public void processPayment(double amount) {
        System.out.println(
                "Processing credit card payment: $" + amount
        );
    }

    @Override
    public boolean refund(double amount) {
        System.out.println(
                "Refunding credit card payment: $" + amount
        );
        return true;
    }
}
