package dev.aniketkadam.server.call;

import dev.aniketkadam.server.user.*;
import dev.aniketkadam.server.webrtc.CallMode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class CallRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:11-alpine");

    @Autowired
    private CallRepository callRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private UserRepository userRepository;

    private User testCaller1;
    private User testCaller2;
    private User testReceiver1;
    private User testReceiver2;
    private Role userRole;

    @BeforeEach
    void setup() {
        this.userRole = roleRepository.save(Role.builder()
                .name(RoleName.USER)
                .build()
        );
        this.testCaller1 = userRepository.save(User.builder()
                .fullName("test caller1")
                .email("caller1@test.com")
                .role(userRole)
                .birthDate(LocalDate.of(2004, 5, 20))
                .googleId(UUID.randomUUID().toString())
                .enabled(true)
                .isAccountCompleted(true)
                .build());
        this.testCaller2 = userRepository.save(User.builder()
                .fullName("test caller2")
                .email("caller2@test.com")
                .role(userRole)
                .birthDate(LocalDate.of(2004, 5, 20))
                .googleId(UUID.randomUUID().toString())
                .enabled(true)
                .isAccountCompleted(true)
                .build());
        this.testReceiver1 = userRepository.save(User.builder()
                .fullName("test receiver1")
                .email("receiver1@test.com")
                .role(userRole)
                .birthDate(LocalDate.of(2002, 2, 2))
                .googleId(UUID.randomUUID().toString())
                .enabled(true)
                .isAccountCompleted(true)
                .build());
        this.testReceiver2 = userRepository.save(User.builder()
                .fullName("test receiver2")
                .email("receiver2@test.com")
                .role(userRole)
                .birthDate(LocalDate.of(2002, 2, 2))
                .googleId(UUID.randomUUID().toString())
                .enabled(true)
                .isAccountCompleted(true)
                .build());
        List<Call> dummyCalls = List.of(
                Call.builder()
                        .caller(testCaller1)
                        .receiver(testReceiver1)
                        .status(CallStatus.ACCEPTED)
                        .mode(CallMode.VIDEO)
                        .startedAt(LocalDateTime.now().minusHours(1))
                        .endedAt(LocalDateTime.now().minusMinutes(10))
                        .build(),
                Call.builder()
                        .caller(testCaller2)
                        .receiver(testReceiver2)
                        .status(CallStatus.ACCEPTED)
                        .mode(CallMode.VIDEO)
                        .startedAt(LocalDateTime.now().minusHours(2))
                        .endedAt(LocalDateTime.now().minusHours(1))
                        .build(),
                Call.builder()
                        .caller(testCaller1)
                        .receiver(testReceiver2)
                        .status(CallStatus.ACCEPTED)
                        .mode(CallMode.AUDIO)
                        .startedAt(LocalDateTime.now().minusHours(3))
                        .endedAt(LocalDateTime.now().minusHours(2))
                        .build()
        );
        this.callRepository.saveAll(dummyCalls);
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
    @DisplayName("Find User By Caller Id Or Receiver Id Tests")
    class FindUserByCallerIdOrReceiverIdTests {

        @Test
        @DisplayName("Should find call by caller id or receiver id successfully")
        void shouldFindCallByParticipantsIdSuccessfully() {
            String userId = testCaller1.getId();

            List<Call> result = callRepository.findUserByCallerIdOrReceiverId(userId);

            assertEquals(2, result.size());
            assertTrue(
                    result.stream()
                            .allMatch(
                                    call -> call.getCaller().getId().equals(userId) ||
                                            call.getReceiver().getId().equals(userId)
                            )
            );
        }

        @Test
        @DisplayName("Should return empty list successfully when user don't have calls")
        void shouldReturnEmptyList_whenUserNotHaveAnyCalls() {
            String userId = "user-123";

            List<Call> result = callRepository.findUserByCallerIdOrReceiverId(userId);

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("Find User All Calls Tests")
    class FindUserAllCallsTests {

        @Test
        @DisplayName("Should return Paged users calls")
        void shouldReturnPagedUserCalls() {
            Pageable pageable = PageRequest.of(
                    0,
                    2,
                    Sort.by("startedAt").descending()
            );

            Page<Call> result = callRepository.findUserAllCalls(pageable, testCaller1.getId());

            assertEquals(2, result.getContent().size());
            assertEquals(2, result.getTotalElements());
            assertTrue(result.isFirst());
            assertTrue(
                    result.getContent().stream().allMatch(call ->
                            call.getCaller().getId().equals(testCaller1.getId())
                                    || call.getReceiver().getId().equals(testCaller1.getId())
                    )
            );
            assertTrue(
                    result.getContent().get(0).getStartedAt()
                            .isAfter(result.getContent().get(1).getStartedAt())
            );
        }

    }

}
