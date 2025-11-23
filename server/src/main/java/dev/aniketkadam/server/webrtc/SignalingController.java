package dev.aniketkadam.server.webrtc;

import dev.aniketkadam.server.call.CallResponse;
import dev.aniketkadam.server.call.HandAction;
import dev.aniketkadam.server.exception.OperationNotPermittedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/calls")
@RequiredArgsConstructor
public class SignalingController {

    private final SignalingService service;

    @PostMapping("/call/initiate")
    public ResponseEntity<CallResponse> initiateCall(
            @RequestBody @Valid CallInitiationRequest request,
            Authentication authentication
    ) throws OperationNotPermittedException {
        return ResponseEntity.ok(service.initiateCall(request, authentication));
    }

    @PostMapping("/call/ringing")
    public void callRinging(
            @RequestBody @Valid CallRingingRequest request,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.callRinging(request, authentication);
    }

    @PostMapping("/call/reject/{call-id}")
    public void callReject(
            @PathVariable("call-id") String callId,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.callReject(callId, authentication);
    }

    @PostMapping("/call/end/{call-id}")
    public void callEnd(
            @PathVariable("call-id") String callId,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.callEnd(callId, authentication);
    }

    @PostMapping("/call/accept/{call-id}")
    public void acceptCall(
            @PathVariable("call-id") String callId,
            Authentication authentication
    ) {
        service.callAccept(callId, authentication);
    }

    @GetMapping("/call/{call-id}/receiver/ready")
    public void receiverReady(
            @PathVariable("call-id") String callId,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.receiverReady(callId, authentication);
    }

    @PostMapping("/call/finish/{call-id}")
    public void finishCall(
            @PathVariable("call-id") String callId,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.finishCall(callId, authentication);
    }

    @GetMapping("/call/{call-id}/camera")
    public void toggleCamera(
            @PathVariable("call-id") String callId,
            @RequestParam("action") String action,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.toggleCamera(callId, action, authentication);
    }

    @GetMapping("/call/{call-id}/mic")
    public void toggleMic(
            @PathVariable("call-id") String callId,
            @RequestParam("action") String action,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.toggleMic(callId, action, authentication);
    }

    @GetMapping("/call/{call-id}/reaction")
    public void sendReaction(
            @PathVariable("call-id") String callId,
            @RequestParam("emoji") String emoji,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.sendReaction(callId, emoji, authentication);
    }

    @GetMapping("/call/{call-id}/hand/raised")
    public void sendHandRaised(
            @PathVariable("call-id") String callId,
            @RequestParam("action") HandAction action,
            Authentication authentication
    ) throws OperationNotPermittedException {
        service.sendHandRaisedOrDown(callId, action, authentication);
    }
}
