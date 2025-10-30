package dev.aniketkadam.server.authentication;

import dev.aniketkadam.server.common.BaseAuditingEntity;
import dev.aniketkadam.server.user.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "refresh_token")
public class RefreshToken extends BaseAuditingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    @Column(length = 800, nullable = false, updatable = false)
    private String token;
    private boolean revoked;
    private boolean isExpired;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
