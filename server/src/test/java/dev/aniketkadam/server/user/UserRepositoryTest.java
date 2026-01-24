package dev.aniketkadam.server.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.JdbcConnectionDetails;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class UserRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:11-alpine");

    @Autowired
    UserRepository userRepository;
    @Autowired
    RoleRepository roleRepository;
    @Autowired
    JdbcConnectionDetails jdbcConnectionDetails;

    private Role userRole;

    @BeforeEach
    void setup() {
        this.userRole = roleRepository.save(Role.builder()
                        .name(RoleName.USER)
                        .build()
        );
        List<User> dummyUsers = List.of(
                User.builder()
                        .fullName("test user1")
                        .email("user1@test.com")
                        .role(userRole)
                        .birthDate(LocalDate.of(2004, 5, 20))
                        .googleId(UUID.randomUUID().toString())
                        .enabled(true)
                        .isAccountCompleted(true)
                        .build(),
                User.builder()
                        .fullName("test user2")
                        .email("user2@test.com")
                        .role(userRole)
                        .birthDate(LocalDate.of(2004, 5, 20))
                        .googleId(UUID.randomUUID().toString())
                        .enabled(true)
                        .isAccountCompleted(true)
                        .build(),
                User.builder()
                        .fullName("test user3")
                        .email("user3@test.com")
                        .role(userRole)
                        .birthDate(LocalDate.of(2004, 5, 20))
                        .googleId(UUID.randomUUID().toString())
                        .enabled(true)
                        .isAccountCompleted(true)
                        .build(),
                User.builder()
                        .fullName("test user4")
                        .email("user4@test.com")
                        .role(userRole)
                        .birthDate(LocalDate.of(2004, 5, 20))
                        .googleId(UUID.randomUUID().toString())
                        .enabled(true)
                        .isAccountCompleted(true)
                        .build(),
                User.builder()
                        .fullName("test user5")
                        .email("user5@test.com")
                        .phone("9178761278")
                        .role(userRole)
                        .birthDate(LocalDate.of(2004, 5, 20))
                        .googleId(UUID.randomUUID().toString())
                        .enabled(true)
                        .isAccountCompleted(true)
                        .build()
                );
        userRepository.saveAll(dummyUsers);
    }

    @Nested
    @DisplayName("Database Connection Tests")
    class DatabaseConnectionTests {

        @Test
        @DisplayName("Should Database connection establish successfully")
        void shouldDatabaseConnectionEstablishSuccessfully() {
            assertTrue(postgres.isCreated());
            assertTrue(postgres.isRunning());
        }
    }

    @Nested
    @DisplayName("FindRandomUsersTests")
    class FindRandomUsersTests {

        @Test
        @DisplayName("Should find random users successfully")
        void shouldFindRandomUserSuccessfully() {
            int limit = 2;
            List<User> result = userRepository.findRandomUser(limit);

            result.forEach(user -> assertNotNull(user.getId()));
            assertTrue(result.stream().allMatch(Objects::nonNull));
            assertEquals(limit, result.size());
            assertNotEquals(result.getFirst().getEmail(), result.getLast().getEmail());
            assertNotEquals(result.getFirst().getId(), result.getLast().getId());
        }

        @Test
        @DisplayName("Should should Respect Limit")
        void shouldRespectLimit() {
            int limit = 2;
            List<User> result = userRepository.findRandomUser(limit);

            assertEquals(limit, result.size());
        }

        @Test
        @DisplayName("Should every times return unique users successfully")
        void shouldEveryTimesReturnUniqueUsersSuccessfully () {
            int limit = 2;
            List<User> result1 = userRepository.findRandomUser(limit);
            List<User> result2 = userRepository.findRandomUser(limit);

            assertNotEquals(
                    result1.stream().map(User::getId).toList(),
                    result2.stream().map(User::getId).toList()
            );
        }
    }

    @Nested
    @DisplayName("Search By FullName Or Phone Or Email Tests")
    class SearchByFullNameOrPhoneOrEmailTests {

        @Test
        @DisplayName("Should Search User By FullName Successfully")
        void shouldSearchUserByFullNameSuccessfully() {
            String keyword = "test user1";
            int size = 5;

            List<User> testSearchedUsers = userRepository.searchByFullNameOrPhoneOrEmail(keyword, size);

            assertEquals(1, testSearchedUsers.size());
            assertEquals("user1@test.com", testSearchedUsers.getFirst().getEmail());
        }

        @Test
        @DisplayName("Should Search User By Email Successfully")
        void shouldSearchUserByEmailSuccessfully() {
            String keyword = "user2@";
            int size = 5;

            List<User> testSearchedUsers = userRepository.searchByFullNameOrPhoneOrEmail(keyword, size);

            assertEquals(1, testSearchedUsers.size());
            assertEquals("test user2", testSearchedUsers.getFirst().getFullName());
        }

        @Test
        @DisplayName("Should Search User By Phone Successfully")
        void shouldSearchUserByPhoneSuccessfully() {
            String keyword = "91";
            int size = 5;

            List<User> testSearchedUsers = userRepository.searchByFullNameOrPhoneOrEmail(keyword, size);

            assertEquals(1, testSearchedUsers.size());
            assertEquals("user5@test.com", testSearchedUsers.getFirst().getEmail());
        }

        @Test
        @DisplayName("Should Search Ignoring Case")
        void shouldSearchIgnoringCase() {
            String keyword = "TEST USER1";
            int size = 5;

            List<User> testSearchedUsers = userRepository.searchByFullNameOrPhoneOrEmail(keyword, size);

            assertEquals(1, testSearchedUsers.size());
            assertEquals("user1@test.com", testSearchedUsers.getFirst().getEmail());
        }

        @Test
        @DisplayName("Should Respect Limit")
        void shouldRespectLimit() {
            String keyword = "test";
            int size = 2;

            List<User> testSearchedUsers = userRepository.searchByFullNameOrPhoneOrEmail(keyword, size);

            assertEquals(2, testSearchedUsers.size());
        }

        @Test
        @DisplayName("")
        void shouldReturnEmptyList_whenNoMatchFound() {
            String keyword = "unknown";
            int size = 5;

            List<User> testSearchedUsers = userRepository.searchByFullNameOrPhoneOrEmail(keyword, size);

            assertTrue(testSearchedUsers.isEmpty());
        }
    }
}
