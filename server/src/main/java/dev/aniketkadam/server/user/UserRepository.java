package dev.aniketkadam.server.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    @Query(value = """
    SELECT * FROM users ORDER BY RANDOM() LIMIT :size
    """, nativeQuery = true)
    List<User> findRandomUser(@Param("size") int limit);

    @Query(value = """
            SELECT * FROM users
            WHERE full_name ILIKE CONCAT('%', :keyword, '%')
                   OR phone ILIKE CONCAT('%', :keyword, '%')
                   OR email ILIKE CONCAT('%', :keyword, '%')
                LIMIT :size
            """,
            nativeQuery = true
    )
    List<User> searchByFullNameOrPhoneOrEmail(@Param("keyword") String keyword, @Param("size") Integer size);
}
