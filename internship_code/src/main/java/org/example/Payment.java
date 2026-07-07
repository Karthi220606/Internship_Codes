package org.example;

public abstract class Payment implements PaymentProcessor {

    protected String transactionId;

    public Payment(String transactionId) {
        this.transactionId = transactionId;
    }

    public void logTransaction() {
        System.out.println(
                "Transaction logged: " + transactionId
        );
    }
}