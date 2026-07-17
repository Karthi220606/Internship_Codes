#include <iostream>
#include <fstream>
#include <cstring>
using namespace std;

class BankAccount
{
private:
    int accountNo;
    char name[50];
    float balance;

public:
    void createAccount()
    {
        cout << "Enter Account Number: ";
        cin >> accountNo;

        cin.ignore();
        cout << "Enter Customer Name: ";
        cin.getline(name, 50);

        cout << "Enter Initial Deposit: ";
        cin >> balance;
    }

    void displayAccount() const
    {
        cout << "\n-----------------------------";
        cout << "\nAccount Number : " << accountNo;
        cout << "\nCustomer Name  : " << name;
        cout << "\nBalance        : " << balance;
        cout << "\n-----------------------------\n";
    }

    int getAccountNo() const
    {
        return accountNo;
    }

    void deposit(float amount)
    {
        balance += amount;
        cout << "Amount Deposited Successfully.\n";
    }

    void withdraw(float amount)
    {
        if (amount <= balance)
        {
            balance -= amount;
            cout << "Withdrawal Successful.\n";
        }
        else
        {
            cout << "Insufficient Balance.\n";
        }
    }

    float getBalance() const
    {
        return balance;
    }
};

void createNewAccount()
{
    BankAccount acc;
    ofstream file("bank.dat", ios::binary | ios::app);

    acc.createAccount();
    file.write((char*)&acc, sizeof(acc));

    file.close();
    cout << "Account Created Successfully!\n";
}

void displayAccount(int accNo)
{
    BankAccount acc;
    ifstream file("bank.dat", ios::binary);

    bool found = false;

    while (file.read((char*)&acc, sizeof(acc)))
    {
        if (acc.getAccountNo() == accNo)
        {
            acc.displayAccount();
            found = true;
            break;
        }
    }

    file.close();

    if (!found)
        cout << "Account Not Found.\n";
}

void depositMoney(int accNo)
{
    BankAccount acc;
    fstream file("bank.dat", ios::binary | ios::in | ios::out);

    bool found = false;
    float amount;

    while (file.read((char*)&acc, sizeof(acc)))
    {
        if (acc.getAccountNo() == accNo)
        {
            cout << "Enter Amount to Deposit: ";
            cin >> amount;

            acc.deposit(amount);

            int pos = file.tellg();
            file.seekp(pos - sizeof(acc));

            file.write((char*)&acc, sizeof(acc));
            found = true;
            break;
        }
    }

    file.close();

    if (!found)
        cout << "Account Not Found.\n";
}

void withdrawMoney(int accNo)
{
    BankAccount acc;
    fstream file("bank.dat", ios::binary | ios::in | ios::out);

    bool found = false;
    float amount;

    while (file.read((char*)&acc, sizeof(acc)))
    {
        if (acc.getAccountNo() == accNo)
        {
            cout << "Enter Amount to Withdraw: ";
            cin >> amount;

            acc.withdraw(amount);

            int pos = file.tellg();
            file.seekp(pos - sizeof(acc));

            file.write((char*)&acc, sizeof(acc));
            found = true;
            break;
        }
    }

    file.close();

    if (!found)
        cout << "Account Not Found.\n";
}

int main()
{
    int choice, accNo;

    do
    {
        cout << "\n====== BANK MANAGEMENT SYSTEM ======\n";
        cout << "1. Create New Account\n";
        cout << "2. Deposit Money\n";
        cout << "3. Withdraw Money\n";
        cout << "4. Check Balance\n";
        cout << "5. Exit\n";
        cout << "Enter Choice: ";
        cin >> choice;

        switch (choice)
        {
        case 1:
            createNewAccount();
            break;

        case 2:
            cout << "Enter Account Number: ";
            cin >> accNo;
            depositMoney(accNo);
            break;

        case 3:
            cout << "Enter Account Number: ";
            cin >> accNo;
            withdrawMoney(accNo);
            break;

        case 4:
            cout << "Enter Account Number: ";
            cin >> accNo;
            displayAccount(accNo);
            break;

        case 5:
            cout << "Thank You!\n";
            break;

        default:
            cout << "Invalid Choice.\n";
        }

    } while (choice != 5);

    return 0;
}
