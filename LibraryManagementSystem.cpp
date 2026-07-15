#include <iostream>
#include <fstream>
#include <cstring>
using namespace std;

class Book
{
private:
    int bookID;
    char title[50];
    char author[50];
    bool issued;

public:
    void addBook()
    {
        cout << "Enter Book ID: ";
        cin >> bookID;

        cin.ignore();
        cout << "Enter Book Title: ";
        cin.getline(title, 50);

        cout << "Enter Author Name: ";
        cin.getline(author, 50);

        issued = false;
    }

    void displayBook()
    {
        cout << "\n-------------------------";
        cout << "\nBook ID   : " << bookID;
        cout << "\nTitle     : " << title;
        cout << "\nAuthor    : " << author;
        cout << "\nStatus    : " << (issued ? "Issued" : "Available");
        cout << "\n-------------------------\n";
    }

    int getBookID()
    {
        return bookID;
    }

    bool getStatus()
    {
        return issued;
    }

    void issueBook()
    {
        issued = true;
    }

    void returnBook()
    {
        issued = false;
    }

    string getTitle()
    {
        return title;
    }

    string getAuthor()
    {
        return author;
    }
};


class Member
{
private:
    int memberID;
    char name[50];

public:
    void addMember()
    {
        cout << "Enter Member ID: ";
        cin >> memberID;

        cin.ignore();
        cout << "Enter Member Name: ";
        cin.getline(name, 50);
    }

    void displayMember()
    {
        cout << "\nMember ID: " << memberID;
        cout << "\nName: " << name << endl;
    }
};


void addBook()
{
    Book b;
    ofstream file("books.dat", ios::binary | ios::app);

    b.addBook();
    file.write((char*)&b, sizeof(b));

    file.close();
    cout << "Book Added Successfully!\n";
}


void searchBook()
{
    Book b;
    ifstream file("books.dat", ios::binary);

    string search;
    bool found = false;

    cin.ignore();
    cout << "Enter Title or Author to Search: ";
    getline(cin, search);

    while(file.read((char*)&b, sizeof(b)))
    {
        if(b.getTitle() == search || b.getAuthor() == search)
        {
            b.displayBook();
            found = true;
        }
    }

    file.close();

    if(!found)
        cout << "Book Not Found.\n";
}


void issueBook()
{
    Book b;
    int id;
    fstream file("books.dat", ios::binary | ios::in | ios::out);

    cout << "Enter Book ID: ";
    cin >> id;

    while(file.read((char*)&b, sizeof(b)))
    {
        if(b.getBookID() == id)
        {
            if(!b.getStatus())
            {
                b.issueBook();

                int pos = file.tellg();
                file.seekp(pos - sizeof(b));
                file.write((char*)&b, sizeof(b));

                cout << "Book Issued Successfully.\n";
            }
            else
                cout << "Book Already Issued.\n";

            file.close();
            return;
        }
    }

    file.close();
    cout << "Book Not Found.\n";
}


void returnBook()
{
    Book b;
    int id;

    fstream file("books.dat", ios::binary | ios::in | ios::out);

    cout << "Enter Book ID: ";
    cin >> id;

    while(file.read((char*)&b, sizeof(b)))
    {
        if(b.getBookID() == id)
        {
            b.returnBook();

            int pos = file.tellg();
            file.seekp(pos - sizeof(b));
            file.write((char*)&b, sizeof(b));

            cout << "Book Returned Successfully.\n";

            file.close();
            return;
        }
    }

    file.close();
    cout << "Book Not Found.\n";
}


int main()
{
    int choice;

    do
    {
        cout << "\n====== LIBRARY MANAGEMENT SYSTEM ======\n";
        cout << "1. Add Book\n";
        cout << "2. Search Book\n";
        cout << "3. Issue Book\n";
        cout << "4. Return Book\n";
        cout << "5. Exit\n";
        cout << "Enter Choice: ";
        cin >> choice;

        switch(choice)
        {
            case 1:
                addBook();
                break;

            case 2:
                searchBook();
                break;

            case 3:
                issueBook();
                break;

            case 4:
                returnBook();
                break;

            case 5:
                cout << "Thank You!\n";
                break;

            default:
                cout << "Invalid Choice.\n";
        }

    } while(choice != 5);

    return 0;
}
