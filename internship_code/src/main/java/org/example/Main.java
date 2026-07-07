package org.example;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {

    public static void main(String[] args) {

        PaymentProcessor creditCard =
                new CreditCardPayment("TXN1001");

        PaymentProcessor wallet =
                new WalletPayment("TXN1002");

        OrderService orderService = new OrderService();

        orderService.checkout(creditCard, 2500);
        orderService.checkout(wallet, 1500);
    }
}
