package org.example;

public class Customer {

    private String name;
    private double accountBalance;

    public Customer(String name, double accountBalance) {
        this.name = name;
        this.accountBalance = accountBalance;
    }

    public String getName() {
        return name;
    }

    public double getBalance() {
        return accountBalance;
    }

    public boolean deductBalance(double amount) {
        if (amount > 0 && amount <= accountBalance) {
            accountBalance -= amount;
            return true;
        }

        return false;
    }
}
