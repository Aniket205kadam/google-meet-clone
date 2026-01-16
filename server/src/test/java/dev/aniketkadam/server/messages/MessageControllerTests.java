package dev.aniketkadam.server.messages;

import dev.aniketkadam.server.call.CallResponse;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.message.MessageRequest;
import dev.aniketkadam.server.message.MessageResponse;
import dev.aniketkadam.server.message.MessageService;
import dev.aniketkadam.server.user.UserResponse;
import lombok.SneakyThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.shaded.com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class MessageControllerTests {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    private MessageService service;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Nested
    class SendMessageTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void sendMessageSuccessfully() {
            String callId = "call-1";
            MessageRequest request = MessageRequest.builder()
                    .content("test message")
                    .build();
            MessageResponse response = MessageResponse.builder()
                    .id("message-1")
                    .content("test message")
                    .sender(UserResponse.builder().build())
                    .receiver(UserResponse.builder().build())
                    .call(CallResponse.builder().id(callId).build())
                    .createdAt(LocalDateTime.now().minusDays(1))
                    .build();

            when(
                    service.sendMessage(
                        eq("call-1"),
                        eq("test message"),
                        any(Authentication.class)
                    )
            ).thenReturn(response);

            mockMvc.perform(
                    post("/api/v1/messages/send/message/call/" + callId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request))
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").value("test message"));
        }


        @Test
        @WithMockUser
        @SneakyThrows
        void shouldReturnBadRequest_whenIsNotParticipant_andAfterCallEnd() {
            when(service.sendMessage(anyString(), anyString(), any(Authentication.class)))
                    .thenThrow(new OperationNotPermittedException("Only caller and receiver can send messages."));

            mockMvc.perform(
                            post("/api/v1/messages/send/message/call/any-id")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(MessageRequest.builder().content("any message").build().getContent())
                    )
                    .andExpect(status().is(500));
        }

        @Test
        @SneakyThrows
        void shouldReturnUnauthenticated_whenNotAuthenticated() {
            mockMvc.perform(
                    post("/api/v1/messages/send/message/call/any-id")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(MessageRequest.builder().content("any message").build().getContent())
            )
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class GetMessagesByCallTests {

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldGetMessagesByCallSuccessfully() {
            String callId = "call-1";
            List<MessageResponse> responses = List.of(
                    MessageResponse.builder()
                            .id("message-1")
                            .call(CallResponse.builder().id(callId).build())
                            .content("test message 1")
                            .sender(UserResponse.builder().build())
                            .receiver(UserResponse.builder().build())
                            .createdAt(LocalDateTime.now().minusDays(1))
                            .build(),
                    MessageResponse.builder()
                            .id("message-2")
                            .call(CallResponse.builder().id(callId).build())
                            .content("test message 2")
                            .sender(UserResponse.builder().build())
                            .receiver(UserResponse.builder().build())
                            .createdAt(LocalDateTime.now().minusHours(10))
                            .build()
            );

            when(service.getMessagesByCallId(eq("call-1"), any(Authentication.class)))
                    .thenReturn(responses);

            mockMvc.perform(
                    get("/api/v1/messages/call/" + callId)
                            .param("call-id", callId)
            )
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].id").value("message-1"))
                    .andExpect(jsonPath("$[1].id").value("message-2"));
        }

        @Test
        @WithMockUser
        @SneakyThrows
        void shouldReturnBadRequest_whenUserIsNotParticipantInCall() {
            String callId = "call-1";

            when(service.getMessagesByCallId(eq("call-1"), any(Authentication.class)))
                    .thenThrow(new OperationNotPermittedException("Only caller and receiver can read messages."));

            mockMvc.perform(
                            get("/api/v1/messages/call/" + callId)
                                    .param("call-id", callId)
                    )
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Only caller and receiver can read messages."));
        }
    }
}
