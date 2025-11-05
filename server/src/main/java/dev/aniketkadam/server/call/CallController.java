package dev.aniketkadam.server.call;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/calls/details")
@RequiredArgsConstructor
public class CallController {

    private final CallService service;

    @GetMapping("/call-id/{call-id}")
    public ResponseEntity<CallResponse> getCallById(
            @PathVariable("call-id") String callId,
            Authentication authentication
    ) throws OperationNotPermittedException {
      return ResponseEntity.ok(service.getCallById(callId, authentication));
    }

}
