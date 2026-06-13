package dev.aniketkadam.server.whiteboard;

import dev.aniketkadam.server.common.BaseAuditingEntity;
import dev.aniketkadam.server.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.List;

import static jakarta.persistence.CascadeType.ALL;
import static jakarta.persistence.EnumType.STRING;
import static jakarta.persistence.GenerationType.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "strokes")
public class Stroke extends BaseAuditingEntity {

    @Id
    @GeneratedValue(strategy = UUID)
    private String id;
    @OneToMany(mappedBy = "stroke", cascade = ALL, orphanRemoval = true)
    private List<Point> points;
    @ManyToOne
    @JoinColumn(name = "whiteboard_id", nullable = false)
    private Whiteboard whiteboard;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User writer;
    @Enumerated(STRING)
    @Column(nullable = false)
    private WhiteboardTool tool;
    @Column(nullable = false)
    private String color;
    @Column(nullable = false)
    private Double width;
}
