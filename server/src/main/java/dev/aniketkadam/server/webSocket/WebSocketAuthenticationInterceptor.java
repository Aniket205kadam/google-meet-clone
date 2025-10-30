package dev.aniketkadam.server.webSocket;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Key;

@Component
public class WebSocketAuthenticationInterceptor implements ChannelInterceptor {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if ("CONNECT".equals(accessor.getCommand().name())) {
            String token = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);

            if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
                token = token.substring(7);

                try {
                    Claims claims = Jwts.parserBuilder()
                            .setSigningKey(getSignKey())
                            .build()
                            .parseClaimsJws(token)
                            .getBody();

                    String username = claims.getSubject();
                    accessor.setUser(() -> username);
                } catch (Exception e) {
                    throw new IllegalArgumentException("Invalid JWT Token");
                }
            }
            else {
                throw new IllegalArgumentException("Missing Authorization header");
            }
        }
        return message;
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64URL.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
