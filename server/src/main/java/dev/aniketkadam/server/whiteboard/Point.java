package dev.aniketkadam.server.whiteboard;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import static jakarta.persistence.GenerationType.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@Entity
@Table(name = "points")
public class Point {

    @Id
    @GeneratedValue(strategy = UUID)
    private String id;
    @ManyToOne
    @JoinColumn(name = "stroke_id", nullable = false)
    private Stroke stroke;
    @Column(name = "x", nullable = false)
    private Double xCord;
    @Column(name = "y", nullable = false)
    private Double yCord;
    @Column(name = "order_index", nullable = false)
    private Integer index;
}
