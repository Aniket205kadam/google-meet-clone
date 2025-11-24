package dev.aniketkadam.server.call;

import dev.aniketkadam.server.exception.OperationNotPermittedException;
import dev.aniketkadam.server.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/all")
    public ResponseEntity<PageResponse<CallResponse>> getAllCallHistory(
            @RequestParam(name = "page", defaultValue = "0", required = false) int page,
            @RequestParam(name = "size", defaultValue = "5", required = false) int size,
            Authentication authentication
    ) {
        return ResponseEntity.ok(service.getAllCallHistory(page, size, authentication));
    }

}
