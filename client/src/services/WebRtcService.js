// services/WebRtcService.js
import WebRtcConfig from "../config/WebRtcConfig";

class WebRtcService {
  client;

  constructor(stompClient) {
    this.client = stompClient;
  }

  createPeerConnection = (peerRequest) => {
    if (peerRequest.peerRef.current) {
      peerRequest.peerRef.current.getSenders().forEach((s) => {
        s.track?.stop();
        peerRequest.peerRef.current.removeTrack(s);
      });

      peerRequest.peerRef.current.onicecandidate = null;
      peerRequest.peerRef.current.ontrack = null;
      peerRequest.peerRef.current.onconnectionstatechange = null;

      peerRequest.peerRef.current.close();
    }

    const pc = new RTCPeerConnection(WebRtcConfig);
    peerRequest.peerRef.current = pc;

    if (peerRequest.localVideoStreamRef.current) {
      peerRequest.localVideoStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, peerRequest.localVideoStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      const incomingStream = event.streams[0];

      if (!incomingStream) return;

      if (peerRequest.remoteVideoStreamRef.current) {
        peerRequest.remoteVideoStreamRef.current.srcObject = incomingStream;
        console.log("Remote stream received");
        setIsRemoteVideoActive(true);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && this.client?.connected) {
        const candidateRequest = {
          callId: peerRequest.callId,
          from: peerRequest.caller.email,
          to: peerRequest.receiver.email,
          type: "candidate",
          candidate: event.candidate.toJSON(),
        };

        this.client.publish(
          "/app/webrtc",
          {},
          JSON.stringify(candidateRequest)
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE state:", pc.iceConnectionState);
    };

    return pc;
  };


  createPeerConnectionReceiver = (peerRequest) => {
  const {
    peerRef,
    localVideoStreamRef,
    remoteVideoStreamRef,
    callId,
    caller,
    receiver,
    setIsRemoteVideoActive
  } = peerRequest;

  // Close previous connection if exists
  if (peerRef.current) {
    peerRef.current.getSenders().forEach(s => {
      s.track?.stop();
      peerRef.current.removeTrack(s);
    });

    peerRef.current.onicecandidate = null;
    peerRef.current.ontrack = null;
    peerRef.current.onconnectionstatechange = null;
    peerRef.current.close();
  }

  const pc = new RTCPeerConnection(WebRtcConfig);
  peerRef.current = pc;

  // Add local tracks
  if (localVideoStreamRef?.current) {
    localVideoStreamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, localVideoStreamRef.current);
    });
  }

  // Remote stream handling
  pc.ontrack = (event) => {
    const incomingStream = event.streams[0];
    if (!incomingStream) return;

    if (remoteVideoStreamRef?.current) {
      remoteVideoStreamRef.current.srcObject = incomingStream;
      console.log("Remote stream received");

      if (setIsRemoteVideoActive) {
        setIsRemoteVideoActive(true);
      }
    }
  };

  // ICE candidate
  pc.onicecandidate = (event) => {
    if (event.candidate && this.client?.connected) {
      const candidateRequest = {
        callId,
        from: caller.email,
        to: receiver.email,
        type: "candidate",
        candidate: event.candidate.toJSON(),
      };

      this.client.publish("/app/webrtc", {}, JSON.stringify(candidateRequest));
    }
  };

  // Debug only
  pc.oniceconnectionstatechange = () => {
    console.log("ICE state:", pc.iceConnectionState);
  };

  return pc;
};


  handleOffer = async (offerRequest, peerRef) => {
    const pc = peerRef.current;
    if (!pc) throw new Error("PeerConnection not initialized");

    await pc.setRemoteDescription(new RTCSessionDescription(offerRequest));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  };

  handleAnswer = async (answerRequest, peerRef) => {
    const pc = peerRef.current;
    if (!pc) throw new Error("PeerConnection not initialized");

    await pc.setRemoteDescription(new RTCSessionDescription(answerRequest));
  };

  handleCandidate = async (candidateRequest, peerRef) => {
    const pc = peerRef.current;
    if (!pc) return;

    try {
      const candidate = new RTCIceCandidate(candidateRequest.candidate);
      await pc.addIceCandidate(candidate);
    } catch (err) {
      if (!err.toString().includes("candidate is null")) {
        console.error("Failed to add ICE candidate:", err);
      }
    }
  };
}

export default WebRtcService;
