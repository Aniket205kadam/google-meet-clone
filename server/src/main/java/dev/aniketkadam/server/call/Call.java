package dev.aniketkadam.server.call;

import dev.aniketkadam.server.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "calls")
public class Call {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    @Column(unique = true, nullable = false, updatable = false)
    private String callId;
    @ManyToOne
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;
    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CallStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}
