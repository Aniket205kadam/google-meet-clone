package dev.aniketkadam.server.call;

import dev.aniketkadam.server.user.User;
import dev.aniketkadam.server.webrtc.CallMode;
import dev.aniketkadam.server.webrtc.CallType;
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
    @ManyToOne
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;
    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CallStatus status;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CallMode mode;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
}
