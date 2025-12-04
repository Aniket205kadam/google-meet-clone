package dev.aniketkadam.server.user;

import dev.aniketkadam.server.common.BaseAuditingEntity;
import dev.aniketkadam.server.profileImg.ProfileImg;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.security.Principal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "users")
public class User extends BaseAuditingEntity implements UserDetails, Principal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String fullName;
    @Column(unique = true, nullable = false)
    private String email;
    @Column(unique = true)
    private String phone;
    private LocalDate birthDate;
    @Column(nullable = false, unique = true)
    private String googleId; // Google unique user ID
    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
    private boolean enabled;
    private boolean isUserInCall;
    @OneToOne
    @JoinColumn(name = "profile_id")
    private ProfileImg profile;
    private boolean isAccountCompleted;

    @Override
    public String getName() {
        return fullName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.getName()));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        User user = (User) obj;
        return id != null && id.equals(user.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
