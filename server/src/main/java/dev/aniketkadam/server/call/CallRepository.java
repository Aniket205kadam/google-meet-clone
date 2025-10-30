package dev.aniketkadam.server.call;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CallRepository extends JpaRepository<Call, String> {

    @Query("""
            SELECT call
            FROM Call call
            WHERE call.caller.id = :userId
            OR call.receiver.id = :userId
            """)
    List<Call> findUserByCallerIdOrReceiverId(@Param("userId") String userId);
}
