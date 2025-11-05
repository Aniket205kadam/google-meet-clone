package dev.aniketkadam.server.call;

import dev.aniketkadam.server.user.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CallMapper {

    private final UserMapper mapper;

    public CallResponse toCallResponse(Call call) {
        return CallResponse.builder()
                .id(call.getId())
                .caller(mapper.toUserResponse(call.getCaller()))
                .receiver(mapper.toUserResponse(call.getReceiver()))
                .callerId(call.getCaller().getId())
                .receiverId(call.getReceiver().getId())
                .status(call.getStatus())
                .mode(call.getMode())
                .startedAt(call.getStartedAt())
                .endedAt(call.getEndedAt())
                .build();
    }
}
