import React, { useEffect, useRef, useState } from "react";
import "./VideoCalling.css";
import CallAction from "../../../utils/calling/action/CallAction";
import { useNavigate, useParams } from "react-router-dom";
import UserService from "../../../services/UserService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import SockJS from "sockjs-client/dist/sockjs.js";
import Stomp from "stompjs";

const VideoCalling = () => {
  const { targetUserId, isVideoOn, isAudioOn } = useParams();

  console.log(targetUserId, isVideoOn, isAudioOn);

  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const currentUserCameraRef = useRef(null);
  const [camera, setCamera] = useState(isVideoOn);
  const [audio, setAudio] = useState(isAudioOn);
  const [facingMode, setFacingMode] = useState("user"); // "user" = front, "environment" = rear
  const [canFlip, setCanFlip] = useState(false);
  const accessToken = useSelector((state) => state.authentication.accessToken);
  const userService = new UserService(accessToken);
  const [connectedUser, setConnectedUser] = useState({
    id: "",
    fullName: "",
    email: "",
    profile: "",
  });
  const [targetUser, setTargetUser] = useState({
    id: "",
    fullName: "",
    email: "",
    profile: "",
  });
  const [callState, setCallState] = useState("calling"); // calling, ringing
  const navigate = useNavigate();
  const stompClient = useRef(null);

  const startCamera = async (mode) => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: camera ? { facingMode: { exact: mode } } : false,
        audio: audio,
      });
      currentUserCameraRef.current.srcObject = stream;
      await currentUserCameraRef.current.play();
    } catch (error) {}
  };

  const fetchUserById = async () => {
    try {
      const response = await userService.fetchUserById(targetUserId);
      setTargetUser(response);
    } catch (error) {
      toast.error("Failed to load target user");
      console.error("Failed to load target user:", error);
    }
  };

  const hasMultipleCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      // Check if at least one device is labeled "front" and another "back" or "rear"
      const hasFront = videoInputs.some((d) => /front|user/i.test(d.label));
      const hasBack = videoInputs.some((d) =>
        /back|rear|environment/i.test(d.label)
      );

      // Only return true if both sides exist
      return hasFront && hasBack;
    } catch (err) {
      console.error("Error checking camera capabilities:", err);
      return false;
    }
  };

  const stopCamera = () => {
    const stream = currentUserCameraRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      currentUserCameraRef.current.srcObject = null;
    }
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const callEnd = () => {
    navigate("/");
  };

  const getUserByToken = async () => {
    try {
      const response = await userService.fetchUserByToken();
      setConnectedUser(response);
    } catch (error) {
      toast.error("Failed to load connected user");
      console.error("Failed to load connected user:", error);
    }
  };

  const sendSignal = (to, type, payload) => {
    if (!stompClient || !stompClient.current.connected) {
      console.warn("STOMP client not connected");
      return;
    }

    const packet = {
      from: connectedUser.email,
      to,
      callType: "VIDEO",
      type,
      sdp: payload?.sdp || null,
      candidate: payload?.candidate || null,
    };
    stompClient.current.send("/app/signal", {}, JSON.stringify(message));
  };


  useEffect(() => {
    startCamera();
  }, [camera, audio]);

  useEffect(() => {
    fetchUserById();
    getUserByToken();
  }, []);

  useEffect(() => {
    const checkAndStartCamera = async () => {
      const hasCameras = await hasMultipleCameras();
      setCanFlip(hasCameras);
      startCamera(facingMode);
    };

    checkAndStartCamera();

    return () => stopCamera();
  }, [facingMode]);

  return (
    <div className="video-calling-page">
      <div className="video-calling-heading">
        <div className="video-back-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="#e3e3e3"
          >
            <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
          </svg>
        </div>

        <div className="video-calling-remote-user">
          <div className="video-calling-remote-user-info">
            <img src={targetUser.profile} />
            <span className="video-calling-remote-email">
              {targetUser.email}
            </span>
          </div>
        </div>

        <div className="video-call-heading-right">
          <div
            className="video-speaker"
            onClick={() => setIsSpeakerOn((prev) => !prev)}
          >
            {isSpeakerOn ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M280-430v310-720 410Zm0 390q-33 0-56.5-23.5T200-120v-720q0-33 23.5-56.5T280-920h400q33 0 56.5 23.5T760-840v80h-80v-80H280v720h400v-80h80v80q0 33-23.5 56.5T680-40H280Zm200-680q17 0 28.5-11.5T520-760q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760q0 17 11.5 28.5T480-720Zm173 354-58-58q12-11 18.5-25.5T620-480q0-16-6.5-30.5T595-536l58-58q23 23 35 52.5t12 61.5q0 32-12 61.5T653-366Zm98 98-56-56q31-31 48-71t17-85q0-45-17-85t-48-71l56-56q43 42 66 97t23 115q0 60-23 115t-66 97Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="m678-395-62-61q2-6 3-12t1-12q0-16-6.5-30.5T595-536l58-58q23 23 35 52.5t12 61.5q0 22-5.5 43T678-395Zm99 98-57-57q20-27 30-59t10-67q0-45-17-85t-48-71l56-56q43 42 66 97t23 115q0 51-16 97.5T777-297Zm43 269L28-820l56-56L876-84l-56 56ZM280-920h400q33 0 56.5 23.5T760-840v80h-80v-80H200q0-33 23.5-56.5T280-920Zm200 200q17 0 28.5-11.5T520-760q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760q0 17 11.5 28.5T480-720ZM280-40q-33 0-56.5-23.5T200-120v-640l80 80v560h400v-160l80 80v80q0 33-23.5 56.5T680-40H280Zm156-360Zm74-164Z" />
              </svg>
            )}
          </div>

          {canFlip && (
            <div className="camera-flip" onClick={handleFlipCamera}>
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
          )}
        </div>
      </div>

      <div className="current-user-camera-preview">
        <video ref={currentUserCameraRef} />
      </div>

      {callState.length > 0 && (
        <div className="call-status2">
          {callState === "calling" ? (
            <div className="call-status-info">
              <span className="arrow-animate">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="m216-160-56-56 464-464H360v-80h400v400h-80v-264L216-160Z" />
                </svg>
              </span>
              <span>calling...</span>
            </div>
          ) : (
            <div className="call-status-info">
              <span className="vibrate">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="m136-144-92-90q-12-12-12-28t12-28q88-95 203-142.5T480-480q118 0 232.5 47.5T916-290q12 12 12 28t-12 28l-92 90q-11 11-25.5 12t-26.5-8l-116-88q-8-6-12-14t-4-18v-114q-38-12-78-19t-82-7q-42 0-82 7t-78 19v114q0 10-4 18t-12 14l-116 88q-12 9-26.5 8T136-144Zm104-202q-29 15-56 34.5T128-268l40 40 72-56v-62Zm480 2v60l72 56 40-38q-29-26-56-45t-56-33Zm-480-2Zm480 2ZM440-680v-200h80v200h-80Zm264 114-56-58 142-142 56 58-142 142Zm-448 0L114-708l56-58 142 142-56 58Z" />
                </svg>
              </span>
              <span>ringing...</span>
            </div>
          )}
        </div>
      )}

      <CallAction
        camera={camera}
        audio={audio}
        setCamera={setCamera}
        setAudio={setAudio}
        endCall={callEnd}
      />
    </div>
  );
};

export default VideoCalling;
