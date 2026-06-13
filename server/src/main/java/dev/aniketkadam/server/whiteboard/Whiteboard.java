package dev.aniketkadam.server.whiteboard;

import dev.aniketkadam.server.call.Call;
import dev.aniketkadam.server.common.BaseAuditingEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.List;

import static jakarta.persistence.CascadeType.ALL;
import static jakarta.persistence.GenerationType.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "whiteboards")
public class Whiteboard extends BaseAuditingEntity {

    @Id
    @GeneratedValue(strategy = UUID)
    private String id;
    @Column(nullable = false)
    private String name;
    @ManyToOne
    @JoinColumn(name = "call_id")
    private Call call;
    @OneToMany(mappedBy = "whiteboard", cascade = ALL, orphanRemoval = true)
    private List<Stroke> strokes;
}
