#include <iostream>
#include <fstream>
#include <cstring>

using namespace std;

class Student
{
public:
    int roll;
    char name[50];
    int age;
    char department[30];
    float marks;

    void input()
    {
        cout << "\nEnter Roll Number : ";
        cin >> roll;

        cin.ignore();

        cout << "Enter Name : ";
        cin.getline(name,50);

        cout << "Enter Age : ";
        cin >> age;

        cin.ignore();

        cout << "Enter Department : ";
        cin.getline(department,30);

        cout << "Enter Marks : ";
        cin >> marks;
    }

    void display()
    {
        cout << "\n-----------------------------";
        cout << "\nRoll Number : " << roll;
        cout << "\nName        : " << name;
        cout << "\nAge         : " << age;
        cout << "\nDepartment  : " << department;
        cout << "\nMarks       : " << marks;
        cout << "\n-----------------------------\n";
    }
};

Student s;


void addStudent()
{
    ofstream file("students.dat", ios::binary | ios::app);

    s.input();

    file.write((char*)&s,sizeof(s));

    file.close();

    cout<<"\nStudent Added Successfully!\n";
}

//---------------------------
// Display Students
//---------------------------

void displayStudents()
{
    ifstream file("students.dat", ios::binary);

    if(!file)
    {
        cout<<"\nNo Records Found!\n";
        return;
    }

    while(file.read((char*)&s,sizeof(s)))
    {
        s.display();
    }

    file.close();
}

//---------------------------
// Search Student
//---------------------------

void searchStudent()
{
    int roll;

    cout<<"\nEnter Roll Number : ";
    cin>>roll;

    ifstream file("students.dat", ios::binary);

    bool found=false;

    while(file.read((char*)&s,sizeof(s)))
    {
        if(s.roll==roll)
        {
            s.display();
            found=true;
            break;
        }
    }

    file.close();

    if(!found)
        cout<<"\nStudent Not Found!\n";
}

//---------------------------
// Update Student
//---------------------------

void updateStudent()
{
    int roll;

    cout<<"\nEnter Roll Number to Update : ";
    cin>>roll;

    fstream file("students.dat", ios::binary | ios::in | ios::out);

    bool found=false;

    while(file.read((char*)&s,sizeof(s)))
    {
        if(s.roll==roll)
        {
            cout<<"\nEnter New Details\n";

            s.input();

            file.seekp(-sizeof(s),ios::cur);

            file.write((char*)&s,sizeof(s));

            found=true;

            cout<<"\nStudent Updated Successfully!\n";

            break;
        }
    }

    file.close();

    if(!found)
        cout<<"\nStudent Not Found!\n";
}

//---------------------------
// Delete Student
//---------------------------

void deleteStudent()
{
    int roll;

    cout<<"\nEnter Roll Number to Delete : ";
    cin>>roll;

    ifstream file("students.dat", ios::binary);

    ofstream temp("temp.dat", ios::binary);

    bool found=false;

    while(file.read((char*)&s,sizeof(s)))
    {
        if(s.roll!=roll)
        {
            temp.write((char*)&s,sizeof(s));
        }
        else
        {
            found=true;
        }
    }

    file.close();
    temp.close();

    remove("students.dat");
    rename("temp.dat","students.dat");

    if(found)
        cout<<"\nStudent Deleted Successfully!\n";
    else
        cout<<"\nStudent Not Found!\n";
}

//---------------------------
// Main
//---------------------------

int main()
{
    int choice;

    do
    {
        cout<<"\n================================";
        cout<<"\n STUDENT MANAGEMENT SYSTEM";
        cout<<"\n================================";
        cout<<"\n1. Add Student";
        cout<<"\n2. Display All Students";
        cout<<"\n3. Search Student";
        cout<<"\n4. Update Student";
        cout<<"\n5. Delete Student";
        cout<<"\n6. Exit";
        cout<<"\n================================";
        cout<<"\nEnter Choice : ";
        cin>>choice;

        switch(choice)
        {
            case 1:
                addStudent();
                break;

            case 2:
                displayStudents();
                break;

            case 3:
                searchStudent();
                break;

            case 4:
                updateStudent();
                break;

            case 5:
                deleteStudent();
                break;

            case 6:
                cout<<"\nThank You!\n";
                break;

            default:
                cout<<"\nInvalid Choice!\n";
        }

    }while(choice!=6);

    return 0;
}
