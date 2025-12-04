package dev.aniketkadam.server.meeting;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, String> {

    Optional<Meeting> findByMeetingCode(String meetingCode);

    Boolean existsByMeetingCode(String meetingCode);
}
