import java.sql.*;

public class BorrowDAO {

    
    private static int getMemberId(Connection conn, String name) throws SQLException {
        String sql = "SELECT member_id FROM members WHERE name = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, name);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("member_id");
        }
        return -1;
    }

    
    private static int getBookId(Connection conn, String title) throws SQLException {
        String sql = "SELECT book_id FROM books WHERE title = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, title);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt("book_id");
        }
        return -1;
    }

    // BORROW using names
    public static void borrowBook(String memberName, String bookTitle) {

        String reduceBook = "UPDATE books SET quantity = quantity - 1 WHERE book_id = ? AND quantity > 0";
        String borrowSql = "INSERT INTO borrow (member_id, book_id, borrow_date, status) VALUES (?, ?, CURDATE(), 'BORROWED')";

        try (Connection conn = DBConnection.getConnection()) {

            int memberId = getMemberId(conn, memberName);
            int bookId = getBookId(conn, bookTitle);

            if (memberId == -1 || bookId == -1) {
                System.out.println("Invalid member or book name");
                return;
            }

            try (PreparedStatement ps1 = conn.prepareStatement(reduceBook)) {
                ps1.setInt(1, bookId);
                int updated = ps1.executeUpdate();

                if (updated == 0) {
                    System.out.println("Book not available");
                    return;
                }
            }

            try (PreparedStatement ps2 = conn.prepareStatement(borrowSql)) {
                ps2.setInt(1, memberId);
                ps2.setInt(2, bookId);
                ps2.executeUpdate();
            }

            System.out.println("Book borrowed!");

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // RETURN using names
    public static void returnBook(String memberName, String bookTitle) {

        String updateBorrow =
                "UPDATE borrow SET return_date = CURDATE(), status = 'RETURNED' " +
                "WHERE member_id = ? AND book_id = ? AND status = 'BORROWED'";

        String updateBook = "UPDATE books SET quantity = quantity + 1 WHERE book_id = ?";

        try (Connection conn = DBConnection.getConnection()) {

            int memberId = getMemberId(conn, memberName);
            int bookId = getBookId(conn, bookTitle);

            if (memberId == -1 || bookId == -1) {
                System.out.println("Invalid member or book name");
                return;
            }

            try (PreparedStatement ps1 = conn.prepareStatement(updateBorrow)) {
                ps1.setInt(1, memberId);
                ps1.setInt(2, bookId);
                ps1.executeUpdate();
            }

            try (PreparedStatement ps2 = conn.prepareStatement(updateBook)) {
                ps2.setInt(1, bookId);
                ps2.executeUpdate();
            }

            System.out.println("Book returned!");

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}