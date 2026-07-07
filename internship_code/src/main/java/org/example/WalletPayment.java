package org.example;

public class WalletPayment extends Payment {

    public WalletPayment(String transactionId) {
        super(transactionId);
    }

    @Override
    public void processPayment(double amount) {
        System.out.println(
                "Processing wallet payment: $" + amount
        );
    }

    @Override
    public boolean refund(double amount) {
        System.out.println(
                "Refunding wallet payment: $" + amount
        );
        return true;
    }
}
