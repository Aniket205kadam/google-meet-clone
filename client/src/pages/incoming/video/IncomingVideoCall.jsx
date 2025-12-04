import { useContext, useEffect, useRef, useState } from "react";
import "./IncomingVideoCall.css";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import CallService from "../../../services/CallService";
import { WebSocketContext } from "../../../components/webSocket/WebSocketProvider";
import { useNavigate } from "react-router-dom";
import Ringing from "../../../assets/music/ringing.mp3";

const IncomingVideoCall = ({ callInfo }) => {
  const currentUserCameraRef = useRef(null);
  const { accessToken } = useSelector((state) => state.authentication);
  const callService = new CallService(accessToken);
  const { setIncomingCall } = useContext(WebSocketContext);
  const [callMode, setCallMode] = useState(callInfo.mode);
  const navigate = useNavigate();

  let startY = 0;
  let endY = 0;

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      currentUserCameraRef.current.srcObject = stream;
      await currentUserCameraRef.current.play();
    } catch (error) {
      toast.error("Camera access denied!");
    }
  };

  const stopCamera = () => {
    const stream = currentUserCameraRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      currentUserCameraRef.current.srcObject = null;
    }
  };

  const handleTouchStart = (e) => {
    startY = e.touches[0].clientY;
  };

  const acceptingCall = async () => {
    try {
      const response = await callService.acceptCall(callInfo.id);
      if (response.status != 200) {
        throw new Error();
      }
      const callId = callInfo.id;
      setIncomingCall({ status: false, data: {} });
      navigate(`/calls/${callId}`);
    } catch (error) {
      toast.error("Failed to accept the call!");
    } finally {
    }
  };

  const handleTouchEnd = (e) => {
    endY = e.changedTouches[0].clientY;
    const diff = startY - endY;
    const threshold = 50;

    if (diff > threshold) {
      acceptingCall();
    } else if (diff < -threshold) {
      setIncomingCall({ status: false, data: {} });
      callService.rejectCall(callInfo.id);
    }
  };

  const isCallRinging = async () => {
    await callService.ringingCall({
      callId: callInfo.id,
      callerId: callInfo.callerId,
      receiverId: callInfo.receiverId,
      isRinging: true,
    });
  };

  useEffect(() => {
    if (currentUserCameraRef.current) {
      startCamera();
    }
    return () => stopCamera();
  }, []);

  useEffect(() => {
    setTimeout(() => isCallRinging(), [2000]);
  }, []);

  return (
    <div className="incoming-video-call-page">
      <audio src={Ringing} loop autoPlay />
      <div className="incoming-call-user">
        <img className="incoming-user-profile" src={callInfo.caller.profile} />
        <span className="call-info">Incoming video call</span>
        <span className="caller-email">{callInfo.caller.fullName}</span>
      </div>
      {callInfo.mode === "VIDEO" && (
        <div className="incoming-call-camera">
          <video ref={currentUserCameraRef} muted />
          <div className="incoming-call-camera-action">
            <div className="incoming-flip-camera">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M480-80q-143 0-253-90T88-400h82q28 106 114 173t196 67q86 0 160-42.5T756-320H640v-80h240v240h-80v-80q-57 76-141 118T480-80Zm0-280q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM80-560v-240h80v80q57-76 141-118t179-42q143 0 253 90t139 230h-82q-28-106-114-173t-196-67q-86 0-160 42.5T204-640h116v80H80Z" />
              </svg>
            </div>
            <div className="incoming-video">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {callInfo.mode === "VIDEO" && <div className="occupy-space"></div>}
      <div className="incoming-call-answer">
        <span className="answer-info">Swipe up to answer</span>
        <div
          className="call-answer-btn"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "none" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="70px"
            viewBox="0 -960 960 960"
            width="70px"
            fill="#e3e3e3"
          >
            <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
          </svg>
        </div>
        <span className="answer-info">Swipe down to decline</span>
      </div>
    </div>
  );
};

export default IncomingVideoCall;
