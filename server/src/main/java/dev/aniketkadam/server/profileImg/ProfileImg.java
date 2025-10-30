package dev.aniketkadam.server.profileImg;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "profile_img")
public class ProfileImg {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private String publicId;
    private String profileUrl;
}
