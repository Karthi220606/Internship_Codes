import java.sql.*;

public class BookDAO {

    public static void addBook(String title, String author, String category, int quantity) {
        String sql = "INSERT INTO books (title, author, category, quantity) VALUES (?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, title);
            ps.setString(2, author);
            ps.setString(3, category);
            ps.setInt(4, quantity);

            int rows = ps.executeUpdate();

            if (rows > 0) {
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        int bookId = rs.getInt(1);
                        System.out.println("Book added! ID = " + bookId);
                    }
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public static void viewBooks() {
        String sql = "SELECT * FROM books";

        try (Connection conn = DBConnection.getConnection();
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery(sql)) {

            while (rs.next()) {
                System.out.println(
                        rs.getInt("book_id") + " | " +
                        rs.getString("title") + " | " +
                        rs.getString("author") + " | " +
                        rs.getString("category") + " | " +
                        rs.getInt("quantity")
                );
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}