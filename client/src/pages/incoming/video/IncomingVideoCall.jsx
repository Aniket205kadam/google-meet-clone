import { useContext, useEffect, useRef, useState } from "react";
import "./IncomingVideoCall.css";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import CallService from "../../../services/CallService";
import { WebSocketContext } from "../../../components/webSocket/WebSocketProvider";
import { useNavigate } from "react-router-dom";
import Ringing from "../../../assets/music/ringing.mp3";
import { useWindowWidth } from "../../../hooks/useWindowWidth.js";

const IncomingVideoCall = ({ callInfo }) => {
  const currentUserCameraRef = useRef(null);
  const { accessToken } = useSelector((state) => state.authentication);
  const callService = new CallService(accessToken);
  const { setIncomingCall } = useContext(WebSocketContext);
  const [callMode, setCallMode] = useState(callInfo.mode);
  const navigate = useNavigate();
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  let startY = 0;
  let endY = 0;

  const width = useWindowWidth();

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

  const rejectCall = () => {
    setIncomingCall({ status: false, data: {} });
    callService.rejectCall(callInfo.id);
  };

  const handleTouchEnd = (e) => {
    endY = e.changedTouches[0].clientY;
    const diff = startY - endY;
    const threshold = 50;

    if (diff > threshold) {
      acceptingCall();
    } else if (diff < -threshold) {
      rejectCall();
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

  if (width > 500) {
    return (
      <div className="incoming-video-call-desktop-container skew-shake-x">
        <audio src={Ringing} loop autoPlay />
        <div className="caller-info">
          <div className="caller-info-profile12">
            <img src={callInfo.caller.profile} alt={callInfo.caller.fullName} />
          </div>
          <div className="caller-info-email">
            <div className="incoming-fullname">{callInfo.caller.fullName}</div>
            <div className="incoming-email">{callInfo.caller.email}</div>
          </div>
        </div>
        <div className="desktop-incoming-video-call-actions">
          <div
            className="incoming-video-action"
            onClick={() => setIsAudioOn((prev) => !prev)}
          >
            {isAudioOn ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="m710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM480-594Zm112 112-72-72v-206q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v126l-80-80v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-123q-104-14-172-93t-68-184h80q0 83 57.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 39T520-243v123h-80Zm352 64L56-792l56-56 736 736-56 56Z" />
              </svg>
            )}
          </div>
          <div
            className="incoming-video-action"
            onClick={() => setIsCameraOn((prev) => !prev)}
          >
            {isCameraOn ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M880-260 720-420v67l-80-80v-287H353l-80-80h367q33 0 56.5 23.5T720-720v180l160-160v440ZM822-26 26-822l56-56L878-82l-56 56ZM498-575ZM382-464ZM160-800l80 80h-80v480h480v-80l80 80q0 33-23.5 56.5T640-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Z" />
              </svg>
            )}
          </div>
          <div className="incoming-video-action answer" onClick={acceptingCall}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z" />
            </svg>
          </div>
          <div className="incoming-video-action decline" onClick={rejectCall}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="m136-304-92-90q-12-12-12-28t12-28q88-95 203-142.5T480-640q118 0 232.5 47.5T916-450q12 12 12 28t-12 28l-92 90q-11 11-25.5 12t-26.5-8l-116-88q-8-6-12-14t-4-18v-114q-38-12-78-19t-82-7q-42 0-82 7t-78 19v114q0 10-4 18t-12 14l-116 88q-12 9-26.5 8T136-304Zm104-198q-29 15-56 34.5T128-424l40 40 72-56v-62Zm480 2v60l72 56 40-38q-29-26-56-45t-56-33Zm-480-2Zm480 2Z" />
            </svg>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="incoming-video-call-page">
        <audio src={Ringing} loop autoPlay />
        <div className="incoming-call-user">
          <img
            className="incoming-user-profile"
            src={callInfo.caller.profile}
          />
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
  }
};

export default IncomingVideoCall;
