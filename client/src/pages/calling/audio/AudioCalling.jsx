import { useContext, useEffect, useRef, useState } from "react";
import "./AudioCalling.css";
import CallAction from "../../../utils/calling/action/CallAction";
import { useNavigate, useParams } from "react-router-dom";
import UserService from "../../../services/UserService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { WebSocketContext } from "../../../components/webSocket/WebSocketProvider";
import CallService from "../../../services/CallService";
import { useWindowWidth } from "../../../hooks/useWindowWidth";
import calling from "../../../assets/music/calling.mp3";

const AudioCalling = () => {
  const { targetUserId } = useParams();
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
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const { accessToken } = useSelector((state) => state.authentication);
  const userService = new UserService(accessToken);
  const [callState, setCallState] = useState("calling"); // calling, ringing
  const navigate = useNavigate();
  const callService = new CallService(accessToken);
  const [currentCall, setCurrentCall] = useState();
  const { stompClient, callStatus } = useContext(WebSocketContext);
  const [isFullOpen, setIsFullOpen] = useState(false);

  const screenWidth = useWindowWidth();

  const getUserById = async () => {
    try {
      const response = await userService.fetchUserById(targetUserId);
      setTargetUser(response);
    } catch (error) {
      toast.error("Failed to get info of target user");
      console.error("Failed to get info of target user: ", error);
    }
  };

  const getUserByToken = async () => {
    try {
      const response = await userService.fetchUserByToken(accessToken);
      setConnectedUser(response);
    } catch (error) {
      toast.error("Failed to get info of connected user");
      console.error("Failed to get info of connected user: ", error);
    }
  };

  const sendCallInitiationRequest = async () => {
    try {
      const CallInitiationRequest = {
        from: connectedUser.email,
        to: targetUser.email,
        mode: "AUDIO",
      };
      const response = await callService.initiateCall(CallInitiationRequest);
      setCurrentCall(response);
    } catch (error) {
      console.error("Failed to send call request: ", error);
      toast.warn(error?.response?.data?.message || "Something is wrong");
      navigate("/");
    }
  };

  const callEnd = async () => {
    if (!currentCall.id) return;
    await callService.endCall(currentCall.id);
    navigate("/");
  };

  useEffect(() => {
    getUserByToken();
    getUserById();
  }, [targetUserId]);

  useEffect(() => {
    if (connectedUser.email.length > 0 && targetUser.email.length > 0) {
      sendCallInitiationRequest();
    }
  }, [connectedUser, targetUser]);

  useEffect(() => setCallState(callStatus.toLowerCase()), [callStatus]);

  useEffect(() => {
    if (
      currentCall &&
      stompClient.current &&
      stompClient.current.connected &&
      connectedUser.email.length > 0
    ) {
      stompClient.current.subscribe(
        `/topic/call/reject/${currentCall.id}/${connectedUser.email}`,
        (message) => {
          toast.info(message);
          navigate("/");
        }
      );

      stompClient.current.subscribe(
        `/topic/call/accept/${currentCall.id}/${connectedUser.email}`,
        (message) => {
          const callId = currentCall.id;
          setCurrentCall(null);
          navigate(`/audio/call/${callId}`);
        }
      );
    }
  }, [stompClient, connectedUser, currentCall]);

  useEffect(() => {
    if (
      currentCall &&
      stompClient.current &&
      stompClient.current.connected &&
      connectedUser.email.length > 0
    ) {
      stompClient.current.subscribe(
        `/topic/call/reject/${currentCall.id}/${connectedUser.email}`,
        (message) => {
          toast.info(message);
          navigate("/");
        }
      );
    }
  }, [stompClient, connectedUser, currentCall]);

  if (screenWidth > 500) {
    return (
      <div className="desktop-video-calling-page">
        <audio src={calling} autoPlay loop />
        <div
          className={`desktop-video-calling-container ${
            isFullOpen ? "full-open" : ""
          }`}
        >
          <div className="desktop-video-calling-header">
            <div className="desktop-video-calling-target-email">
              {targetUser?.email}
            </div>
            <div className="desktop-video-calling-status">
              <div className="status">{callState}...</div>
              <div
                className="status-symbol"
                onClick={() => setIsFullOpen((prev) => !prev)}
              >
                {isFullOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v280h-80v-280H200v560h280v80H200Zm360 0v-80h144L332-572l56-56 372 371v-143h80v280H560Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
          <div className="encrypted-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M420-360h120l-23-129q20-10 31.5-29t11.5-42q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 23 11.5 42t31.5 29l-23 129Zm60 280q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z" />
            </svg>
            This call is encrypted
          </div>
          <div
            className={`desktop-video-calling-main ${
              isFullOpen ? "full-open" : ""
            }`}
          >
            <div className="desktop-audio-target-user">
              <img
                style={isFullOpen ? { width: "200px", height: "200px" } : {}}
                src={targetUser?.profile}
                alt={targetUser?.fullName + " profile"}
              />
            </div>
          </div>
          <CallAction
            camera={false}
            audio={isAudioOn}
            setCamera={() => {}}
            setAudio={setIsAudioOn}
            endCall={callEnd}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="audio-calling-page">
      <div className="audio-calling-heading">
        <div className="audio-back-btn" onClick={() => navigate("/")}>
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
        <div
          className="audio-speaker"
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
      </div>

      <div className="audio-call-info1">
        {callState === "calling" ? (
          <div className="audio-call-status">
            Calling
            <p class="dot-animation">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </p>
          </div>
        ) : (
          <div className="audio-call-status">
            ringing
            <p class="dot-animation">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </p>
          </div>
        )}
        <div className="audio-remote-user-email">{targetUser.email}</div>
        <div className="info">Audio call</div>
      </div>

      <div className="remote-user-picture">
        <img src={targetUser.profile} />
      </div>

      <CallAction
        camera={false}
        audio={isAudioOn}
        setCamera={() => {}}
        setAudio={setIsAudioOn}
        endCall={() => navigate("/")}
      />
    </div>
  );
};

export default AudioCalling;
