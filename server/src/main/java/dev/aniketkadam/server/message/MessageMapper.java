package dev.aniketkadam.server.message;

import dev.aniketkadam.server.call.CallMapper;
import dev.aniketkadam.server.user.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageMapper {

    private final UserMapper userMapper;
    private final CallMapper callMapper;

    public MessageResponse toMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .sender(userMapper.toUserResponse(message.getSender()))
                .receiver(userMapper.toUserResponse(message.getReceiver()))
                .call(callMapper.toCallResponse(message.getCall()))
                .createdAt(message.getCreatedAt())
                .build();
    }
}
