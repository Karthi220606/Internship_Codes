import java.util.Scanner;

public class Main {

    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        while (true) {

            System.out.println("\n=== Library System ===");
            System.out.println("1. Add Book");
            System.out.println("2. View Books");
            System.out.println("3. Add Member");
            System.out.println("4. Borrow Book");
            System.out.println("5. Return Book");
            System.out.println("6. Exit");
            System.out.print("Choice: ");

            int choice = sc.nextInt();
            sc.nextLine();

            switch (choice) {

                case 1:
                    System.out.print("Title: ");
                    String t = sc.nextLine();

                    System.out.print("Author: ");
                    String a = sc.nextLine();

                    System.out.print("Category: ");
                    String c = sc.nextLine();

                    System.out.print("Qty: ");
                    int q = sc.nextInt();
                    sc.nextLine();

                    BookDAO.addBook(t, a, c, q);
                    break;

                case 2:
                    BookDAO.viewBooks();
                    break;

                case 3:
                    System.out.print("Name: ");
                    String n = sc.nextLine();

                    System.out.print("Email: ");
                    String e = sc.nextLine();

                    System.out.print("Phone: ");
                    String p = sc.nextLine();

                    MemberDAO.addMember(n, e, p);
                    break;

                case 4:
                    System.out.print("Member Name: ");
                    String mName = sc.nextLine();

                    System.out.print("Book Title: ");
                    String bTitle = sc.nextLine();

                    BorrowDAO.borrowBook(mName, bTitle);
                    break;

                case 5:
                    System.out.print("Member Name: ");
                    String rName = sc.nextLine();

                    System.out.print("Book Title: ");
                    String rTitle = sc.nextLine();

                    BorrowDAO.returnBook(rName, rTitle);
                    break;

                case 6:
                    System.out.println("Exiting...");
                    sc.close();
                    return;

                default:
                    System.out.println("Invalid choice");
            }
        }
    }
}