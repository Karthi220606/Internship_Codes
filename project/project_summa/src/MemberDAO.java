import java.sql.*;

public class MemberDAO {

    public static void addMember(String name, String email, String phone) {
        String sql = "INSERT INTO members (name, email, phone) VALUES (?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, name);
            ps.setString(2, email);
            ps.setString(3, phone);

            int rows = ps.executeUpdate();

            if (rows > 0) {
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        int memberId = rs.getInt(1);
                        System.out.println("Member added! ID = " + memberId);
                    }
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}