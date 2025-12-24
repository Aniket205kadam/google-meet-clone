import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { WebSocketContext } from "../../components/webSocket/WebSocketProvider"; // adjust path
import CallService from "../../services/CallService";
import UserService from "../../services/UserService";
import InCallMessages from "../../components/inCallMessages/InCallMessages";
import ToolBox from "../../components/videoCallScreen/toolBox/ToolBox";
import "../videoCallScreen/VideoCallScreen.css";
import "./AudioCallScreen.css";
import WebRtcConfig from "../../config/WebRtcConfig";
import { toast } from "react-toastify";
import useClickOutside from "../../hooks/useClickOutside";
import { EmojiMap } from "../../utils/emojis/EmojiMap";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { useMicLevel2 } from "../../hooks/useMicLevel2";
import { useMicLevel } from "../../hooks/useMicLevel";

const AudioCallScreen = () => {
  const { callId } = useParams();
  const { accessToken } = useSelector((state) => state.authentication);
  const { stompClient, isStompConnected } = useContext(WebSocketContext);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isToolBoxOpen, setIsToolBoxOpen] = useState(false);
  const toolBoxRef = useRef(null);
  const [isReactionOpen, setIsReactionOpen] = useState(false);
  const [isOnlyDisplayMain, setIsOnlyDisplayMain] = useState(false);
  const [isOpenMessageBox, setIsOpenMessageBox] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isRemoteUserCameraOff, setIsRemoteUserCameraOff] = useState(false);
  const [isRemoteUserMicOff, setIsRemoteUserMicOff] = useState(false);
  const [currentReaction, setCurrentReaction] = useState({
    emoji: null,
    name: null,
  });
  const [randomValue, setRandomValue] = useState(20);
  const [currentUser, setCurrentUser] = useState(null);
  const [callDetails, setCallDetails] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [isMessageUnseen, setIsMessageUnseen] = useState(false);
  const [currentHandAction, setCurrentHandAction] = useState(null);
  const [isShowCallDetails, setIsShowCallDetails] = useState(false);

  const currentUserRef = useRef(null);
  const callDetailsRef = useRef(null);
  const targetUserRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const isOpenMessageBoxRef = useRef(false);

  const navigate = useNavigate();
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const userService = new UserService(accessToken);
  const callService = new CallService(accessToken);

  useClickOutside(toolBoxRef, () => setIsToolBoxOpen(false));
  const screenWidth = useWindowWidth();

  const getCameraStream = async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      localStreamRef.current = stream;

      return stream;
    } catch (error) {
      console.error("Failed to get access of camera/mic:", error);
    }
  };

  const stopCameraStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current = null;
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await userService.fetchUserByToken();
      setCurrentUser(response);
      currentUserRef.current = response;
    } catch (error) {
      console.error("Failed to fetch current user:", response);
    }
  };

  const getCallDetails = async () => {
    try {
      const response = await callService.fetchCallById(callId);
      setCallDetails(response);
      callDetailsRef.current = response;
    } catch (error) {
      console.error("Failed to fetch call details by ID: ", error);
    }
  };

  const createPeerConnection = async () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    const peerConnection = new RTCPeerConnection(WebRtcConfig);
    peerConnectionRef.current = peerConnection;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteStreamRef.current = event.streams[0];

        remoteVideoRef.current.onloadedmetadata = () => {
          remoteVideoRef.current
            .play()
            .catch((err) => console.error("Auto-play error:", err));
        };
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        endCall();
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && isStompConnected) {
        const candidateRequest = {
          callId: callDetailsRef.current.id,
          from: currentUserRef.current.email,
          to: targetUserRef.current.email,
          type: "candidate",
          candidate: event.candidate,
        };

        stompClient.current.send(
          "/app/webrtc",
          {},
          JSON.stringify(candidateRequest)
        );
      }
    };

    return peerConnection;
  };

  const sendReadySignal = async () => {
    await callService.receiverReady(callDetailsRef.current.id);
  };

  const onPeerConnectionCreated = async () => {
    if (currentUserRef.current.id === callDetailsRef.current.receiver.id) {
      setTimeout(sendReadySignal, 1000);
    }
  };

  const handleIncomingSignals = async (data) => {
    try {
      switch (data.type) {
        case "offer":
          await handleOffer(data);
          break;
        case "answer":
          await handleAnswer(data);
          break;
        case "candidate":
          await handleCandidate(data);
          break;
      }
    } catch (error) {}
  };

  const initializeSignalingChannel = () => {
    return stompClient.current.subscribe(
      `/topic/webrtc/connection/${currentUser.email}`,
      (request) => {
        const data = JSON.parse(request.body);
        handleIncomingSignals(data);
      }
    );
  };

  const listeningCallActions = () => {
    return stompClient.current.subscribe(
      `/topic/call/finish/${callId}/${currentUser.email}`,
      (request) => {
        toast.info("Call ended.");
        navigate("/");
      }
    );
  };

  const listeningMediaActions = () => {
    return stompClient.current.subscribe(
      `/topic/media/${callId}/${currentUser.email}`,
      (request) => {
        const data = JSON.parse(request.body);
        if (data.mediaType === "CAMERA") {
          setIsRemoteUserCameraOff(!data.on);
        } else if (data.mediaType === "MIC") {
          setIsRemoteUserMicOff(!data.on);
        } else {
          console.error("Media action in wrong format.");
        }
      }
    );
  };

  const listeningReactions = () => {
    return stompClient.current.subscribe(
      `/topic/reaction/${callId}/${currentUser.email}`,
      (request) => {
        const data = JSON.parse(request.body);
        const value = Math.floor(Math.random() * (80 - 20 + 1)) + 20;
        setRandomValue(value);
        setCurrentReaction({ emoji: data.emoji, name: data.name });
      }
    );
  };

  const listeningMessages = () => {
    return stompClient.current.subscribe(
      `/topic/call/${callId}/messages/user/${currentUser.email}`,
      (messageResponse) => {
        const message = JSON.parse(messageResponse.body);
        setCurrentMessage(message);
        if (!isOpenMessageBoxRef.current) {
          setIsMessageUnseen(true);
        }
      }
    );
  };

  const listeningHandAction = () => {
    return stompClient.current.subscribe(
      `/topic/hand/action/${callId}/${currentUser.email}`,
      (response) => {
        const data = JSON.parse(response.body);
        if (data.action === "RAISED") {
          setCurrentHandAction(data);
        } else if (data.action === "PUT_DOWN") {
          setCurrentHandAction(null);
        }
      }
    );
  };

  const sendOffer = async () => {
    try {
      if (!peerConnectionRef.current) {
        return;
      }
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      if (isStompConnected) {
        stompClient.current.send(
          "/app/webrtc",
          {},
          JSON.stringify({
            callId: callDetailsRef.current.id,
            from: callDetailsRef.current.caller.email,
            to: callDetailsRef.current.receiver.email,
            type: "offer",
            sdp: offer.sdp,
          })
        );
      }
    } catch (error) {
      console.error("Failed to send offer:", error);
    }
  };

  const handleCandidate = async (data) => {
    try {
      if (!peerConnectionRef.current) {
        console.warn("Peer connection not established yet");
        return;
      }
      const peerConnection = peerConnectionRef.current;
      const candidate = new RTCIceCandidate(data.candidate);
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error("Failed to send ice candidate:", error);
    }
  };

  const handleOffer = async (data) => {
    try {
      if (!peerConnectionRef.current) {
        return;
      }
      const peerConnection = peerConnectionRef.current;
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "offer", sdp: data.sdp })
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (isStompConnected) {
        stompClient.current.send(
          "/app/webrtc",
          {},
          JSON.stringify({
            callId: callDetailsRef.current.id,
            from: currentUserRef.current.email,
            to: targetUserRef.current.email,
            type: "answer",
            sdp: answer.sdp,
          })
        );
      }
    } catch (error) {
      console.error("Failed handle offer:", error);
    }
  };

  const cameraToggle = async () => {
    try {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOn;
      });
      const action = isCameraOn ? "ON" : "OFF";
      await callService.toggleCamera(callId, action);
    } catch (err) {
      console.error("Failed to toggle the camera");
    }
  };

  const micToggle = async () => {
    try {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isAudioOn;
      });
      const action = isAudioOn ? "ON" : "OFF";
      await callService.toggleMic(callId, action);
    } catch (error) {
      console.error("Failed to toggle the mic");
    }
  };

  const startAgainCameraStream = async () => {
    if (!localStreamRef.current) return;
    await cameraToggle();
    await micToggle();
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  const handleAnswer = async (data) => {
    try {
      if (!peerConnectionRef.current) {
        return;
      }
      const peerConnection = peerConnectionRef.current;
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: data.sdp })
      );
    } catch (error) {
      console.error("Failed to handle answer:", error);
    }
  };

  const endCall = async () => {
    try {
      await callService.finishCall(callId);
      navigate("/");
    } catch (error) {
      toast.error("Unable to terminate the call.");
    }
  };

  const sendReaction = async (emoji) => {
    try {
      await callService.sendUserReaction(callId, emoji);
      const value = Math.floor(Math.random() * (80 - 20 + 1)) + 20;
      setRandomValue(value);
      setCurrentReaction({ emoji: emoji, name: "You" });
    } catch (error) {
      toast.error("Failed to send the reaction.");
    }
  };

  useEffect(() => {
    (async () => {
      await getCameraStream();
      await getCurrentUser();
      await getCallDetails();
    })();
  }, []);

  useEffect(() => {
    if (currentUser && callDetails) {
      setTargetUser(
        callDetails.caller.id === currentUser.id
          ? callDetails.receiver
          : callDetails.caller
      );
      targetUserRef.current =
        callDetails.caller.id === currentUser.id
          ? callDetails.receiver
          : callDetails.caller;
    }
  }, [currentUser, callDetails]);

  useEffect(() => {
    if (
      currentUser &&
      isStompConnected &&
      callDetails &&
      currentUser.id === callDetails.caller.id
    ) {
      let subscription = stompClient.current.subscribe(
        `/topic/call/${callDetails.id}/ready/${currentUser.email}`,
        (res) => {
          sendOffer();
        }
      );
      return () => {
        subscription?.unsubscribe?.();
      };
    }
  }, [currentUser, callDetails, isStompConnected]);

  useEffect(() => {
    (async () => {
      if (targetUser && callDetails && isStompConnected) {
        const peerConnection = await createPeerConnection();
        if (peerConnection.connectionState === "new") {
          await onPeerConnectionCreated();
        }
      }
    })();
  }, [targetUser, callDetails, isStompConnected]);

  useEffect(() => {
    let subscription;
    let subscription2;
    let subscription3;
    let subscription4;
    let subscription5;
    let subscription6;
    if (currentUser && isStompConnected) {
      subscription = initializeSignalingChannel();
      subscription2 = listeningCallActions();
      subscription3 = listeningMediaActions();
      subscription4 = listeningReactions();
      subscription5 = listeningMessages();
      subscription6 = listeningHandAction();
    }
    return () => {
      subscription?.unsubscribe?.();
      subscription2?.unsubscribe?.();
      subscription3?.unsubscribe?.();
      subscription4?.unsubscribe?.();
      subscription5?.unsubscribe?.();
      subscription6?.unsubscribe?.();
    };
  }, [currentUser, isStompConnected]);

  useEffect(() => {
    const handleUnload = () => {
      endCall();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // before unmount the component stop camera
  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  useEffect(() => {
    startAgainCameraStream();
  }, [isCameraOn, isAudioOn]);

  useEffect(() => {
    let timeoutId;
    if (currentReaction.name?.length > 0) {
      timeoutId = setTimeout(
        () => setCurrentReaction({ emoji: null, name: null }),
        8000
      );
    }
    return () => clearTimeout(timeoutId);
  }, [currentReaction.name]);

  useEffect(() => {
    let timeoutId;
    if (currentMessage?.content?.length > 0) {
      timeoutId = setTimeout(() => setCurrentMessage(null), 5000);
    }
    return () => clearTimeout(timeoutId);
  }, [currentMessage]);

  const sendHandRaisedOrDown = async () => {
    try {
      const action = isHandRaised ? "RAISED" : "PUT_DOWN";
      await callService.sendUserHandAction(callId, action);
    } catch (error) {
      toast.error("Failed to send hand action");
    }
  };

  useEffect(() => {
    sendHandRaisedOrDown();
  }, [isHandRaised]);

  const [isCurrentUserSpeaking, setIsCurrentUserSpeaking] = useState(false);
  const [isRemoteUserSpeaking, setIsRemoteUserSpeaking] = useState(false);

  const currentUserAudioLevel = useMicLevel();
  const remoteUserAudioLevel = useMicLevel2(remoteStreamRef.current);

  const handleCurrentUserAudioLevel = () => {
    if (Math.min(currentUserAudioLevel / 100, 1) === 1) {
      setIsCurrentUserSpeaking(true);
    } else {
      setIsCurrentUserSpeaking(false);
    }
  };

  const handleRemoteUserAudioLevel = () => {
    if (screenWidth <= 500) {
        return;
    }
    if (remoteUserAudioLevel / 100 > 0) {
      setIsRemoteUserSpeaking(true);
    } else {
      setIsRemoteUserSpeaking(false);
    }
  };

  useEffect(() => {
    handleCurrentUserAudioLevel();
  }, [currentUserAudioLevel]);

  useEffect(() => {
    handleRemoteUserAudioLevel();
  }, [remoteUserAudioLevel]);

  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <div className="video-call-screen-page">
      {isOpenMessageBox && (
        <InCallMessages
          callDetails={callDetails}
          currentUser={currentUser}
          remoteUser={targetUser}
          onClose={() => {
            setIsOpenMessageBox(false);
            isOpenMessageBoxRef.current = false;
          }}
          stompClient={stompClient}
          isStompConnected={isStompConnected}
          localStream={localStreamRef.current}
          remoteStream={remoteStreamRef.current}
        />
      )}

      {isToolBoxOpen && (
        <ToolBox
          ref={toolBoxRef}
          isHandRaised={isHandRaised}
          setIsHandRaised={setIsHandRaised}
          isSoundOn={isSoundOn}
          openMessageBox={() => {
            setIsOpenMessageBox(true);
            isOpenMessageBoxRef.current = true;
            setIsToolBoxOpen(false);
          }}
          onClose={() => setIsToolBoxOpen(false)}
          isMessageUnseen={isMessageUnseen}
          setIsMessageUnseen={setIsMessageUnseen}
        />
      )}

      {screenWidth <= 500 && (
        <div className="video-call-screen-heading">
          <div className="video-call-left">
            <button className="call-screen-back-btn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
              </svg>
            </button>
          </div>
          <div className="video-call-right">
            {isSoundOn ? (
              <div className="sound-icon" onClick={() => setIsSoundOn(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z" />
                </svg>
              </div>
            ) : (
              <div className="sound-icon" onClick={() => setIsSoundOn(true)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Zm-80 238v-94l-72-72H200v80h114l86 86Zm-36-130Z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="video-call-main">
        {screenWidth <= 500 && (
          <div className="audio-call-info">
            <div className="timer">
              {String(minutes).padStart(2, "0")}:
              {String(remainingSeconds).padStart(2, "0")}
            </div>
            <div className="caller-name">{targetUser?.fullName}</div>
            <div className="call-status1">Audio call</div>
          </div>
        )}

        {currentReaction.name && (
          <div className="reaction" style={{ left: `${randomValue}%` }}>
            <div className="reaction-animation">
              {EmojiMap[currentReaction.emoji]}
            </div>
            <div className="reaction-name">{currentReaction.name}</div>
          </div>
        )}

        {currentHandAction && (
          <div className="hand-raised-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#ffffff"
            >
              <path d="M183-380q-8 4-16.5.5T155-391l-30-80q-5-14-4.5-27.5T133-517q25-10 46.5 7t32.5 44l16 43q3 8 .5 14.5T219-398l-36 18ZM433-80q-17 0-33.5-7T372-107L210-294q-11-13-10-29t14-27q13-11 29-9.5t27 13.5l90 103q0-8 2-15.5t6-15.5l-46-132q-5-16 2-31t23-20q16-5 31 2t20 23l39 112h23v-120q0-17 11.5-28.5T500-480q17 0 28.5 11.5T540-440v120h24l21-89q4-17 17.5-25.5T633-439q17 4 25.5 17.5T663-391l-16 71q5 1 10.5 2t10.5 3l15-39q6-16 21-23t31-1q15 6 21.5 21t.5 31l-37 98v68q0 33-23.5 56.5T640-80H433ZM311-699q-8 1-14.5-4.5T289-717l-9-79q-2-17 8.5-29.5T316-840q17-2 29.5 8.5T360-804l8 79q1 8-4.5 14.5T350-703l-39 4Zm22 204q-9 2-16.5-3t-8.5-14l-12-104q-2-17 8.5-29.5T332-660q17-2 29.5 8.5T376-624l11 97q1 8-3 14t-12 8l-39 10Zm107 335h200v-80H440v80Zm40-360q-8 0-14-6t-6-14v-100q0-17 11.5-28.5T500-680q17 0 28.5 11.5T540-640v100q0 8-6 14t-14 6h-40Zm0-200q-8 0-14-6t-6-14v-100q0-17 11.5-28.5T500-880q17 0 28.5 11.5T540-840v100q0 8-6 14t-14 6h-40Zm175 246-40-10q-8-2-12-8t-3-14l11-98q2-17 14.5-27.5T655-640q17 2 27.5 14.5T691-596l-11 105q-1 9-8.5 14t-16.5 3Zm23-201-40-4q-8-1-13.5-7.5T620-701l8-79q2-17 14.5-27.5T672-816q17 2 27.5 14.5T708-772l-8 79q-1 8-7.5 13.5T678-675Zm80 265-39-12q-8-2-11.5-9t-1.5-15l15-56q5-16 19-24.5t30-3.5q16 5 24 18.5t4 29.5l-15 58q-2 8-9.5 12t-15.5 2Zm42-151-39-10q-8-2-12-9.5t-2-15.5l13-46q7-24 17-45t31-16q25 6 30 33t-3 56l-11 39q-2 8-9 12t-15 2ZM440-160h200-200Z" />
            </svg>
            <span>{currentHandAction.sender.fullName.split(" ")[0]}</span>
          </div>
        )}

        {currentMessage && (
          <div
            className="current-message"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpenMessageBox(true);
              isOpenMessageBoxRef.current = true;
              setIsToolBoxOpen(false);
              setCurrentMessage(null);
            }}
          >
            <div className="current-message-sender-profile">
              <img src={currentMessage.sender.profile} />
            </div>
            <div className="content-area">
              <div className="sender-name">
                {currentMessage.sender.fullName.length > 12
                  ? currentMessage.sender.fullName.substring(0, 10) + "..."
                  : currentMessage.sender.fullName}
              </div>
              <div className="content">
                {currentMessage.content.length > 10
                  ? currentMessage.content.substring(0, 10) + "..."
                  : currentMessage.content}
              </div>
            </div>
          </div>
        )}

        <div
          className="remote-user-mic-off"
          style={isRemoteUserMicOff ? { opacity: "1" } : { opacity: "0" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="#e3e3e3"
          >
            <path d="m710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM480-594Zm112 112-72-72v-206q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v126l-80-80v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-123q-104-14-172-93t-68-184h80q0 83 57.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 39T520-243v123h-80Zm352 64L56-792l56-56 736 736-56 56Z" />
          </svg>
        </div>

        <div
          className="remote-user-profile-audio"
          style={isRemoteUserSpeaking ? { border: "4px solid #26a7df" } : {}}
        >
          <img
            src={targetUser?.profile}
            alt={targetUser?.fullName + " profile"}
          />
          {screenWidth > 500 && (
            <div className="remote-user-name-audio">{targetUser?.fullName}</div>
          )}
        </div>

        <div
          className="current-user-profile-audio"
          style={isCurrentUserSpeaking ? { border: "4px solid #26a7df" } : {}}
        >
          <img
            src={currentUser?.profile}
            alt={currentUser?.fullName + " profile"}
          />
          <div className="current-user-name-audio">{currentUser?.fullName}</div>
        </div>

        <audio ref={remoteVideoRef} muted={!isSoundOn} autoPlay playsInline />
      </div>

      <div
        className="reaction-emojis"
        style={
          isOnlyDisplayMain
            ? isReactionOpen
              ? { left: 2, opacity: "0" }
              : { opacity: "0" }
            : isReactionOpen
            ? { left: 2 }
            : {}
        }
      >
        <span
          className="emoji"
          onClick={(e) => {
            e.stopPropagation();
            sendReaction("💖");
            setIsReactionOpen(false);
          }}
        >
          💖
        </span>
        <span
          className="emoji"
          onClick={(e) => {
            e.stopPropagation();
            sendReaction("👍");
            setIsReactionOpen(false);
          }}
        >
          👍
        </span>
        <span
          className="emoji"
          onClick={(e) => {
            e.stopPropagation();
            sendReaction("🎉");
            setIsReactionOpen(false);
          }}
        >
          🎉
        </span>
        <span
          className="emoji"
          onClick={(e) => {
            e.stopPropagation();
            sendReaction("👏");
            setIsReactionOpen(false);
          }}
        >
          👏
        </span>
        <span
          className="emoji"
          onClick={(e) => {
            e.stopPropagation();
            sendReaction("😂");
            setIsReactionOpen(false);
          }}
        >
          😂
        </span>
        <span
          className="emoji"
          onClick={(e) => {
            e.stopPropagation();
            sendReaction("😯");
            setIsReactionOpen(false);
          }}
        >
          😯
        </span>
        <span
          className="emoji"
          onClick={(e) => {
            e.stopPropagation();
            sendReaction("😥");
            setIsReactionOpen(false);
          }}
        >
          😥
        </span>
        <span
          className="emoji"
          onClick={(e) => {
            e.stopPropagation();
            sendReaction("🤔");
            setIsReactionOpen(false);
          }}
        >
          🤔
        </span>
        <span
          className="emoji"
          onClick={(e) => {
            e.stopPropagation();
            sendReaction("👎");
            setIsReactionOpen(false);
          }}
        >
          👎
        </span>
      </div>

      {isShowCallDetails && (
        <div className="floating-video-call-details">
          <div className="call-details detail-info1">
            <div className="call-details-aria aria">meeting details</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
            </svg>
          </div>
          <div className="people-info detail-info1">
            <div className="people-info-aria aria">People</div>
            <div className="people-count">{2}</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm720 0v-120q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v120H760ZM360-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm400-160q0 66-47 113t-113 47q-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113ZM120-240h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0 320Zm0-400Z" />
            </svg>
          </div>
          <div
            className={`chat-with-people detail-info1 ${
              isOpenMessageBox ? "btn-active" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              console.log("click heres");
              setIsOpenMessageBox(true);
              isOpenMessageBoxRef.current = true;
              setIsToolBoxOpen(false);
            }}
          >
            <div className="chat-with-people-aria aria">Chat with everyone</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
            </svg>
          </div>
          <div className="call-tools detail-info1">
            <div className="call-tools-aria aria">Meeting tools</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M240-160q-33 0-56.5-23.5T160-240q0-33 23.5-56.5T240-320q33 0 56.5 23.5T320-240q0 33-23.5 56.5T240-160Zm240 0q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm240 0q-33 0-56.5-23.5T640-240q0-33 23.5-56.5T720-320q33 0 56.5 23.5T800-240q0 33-23.5 56.5T720-160ZM240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400ZM240-640q-33 0-56.5-23.5T160-720q0-33 23.5-56.5T240-800q33 0 56.5 23.5T320-720q0 33-23.5 56.5T240-640Zm240 0q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Zm240 0q-33 0-56.5-23.5T640-720q0-33 23.5-56.5T720-800q33 0 56.5 23.5T800-720q0 33-23.5 56.5T720-640Z" />
            </svg>
          </div>
          {callDetails?.caller?.id === currentUser?.id && (
            <div className="host-option detail-info1">
              <div className="host-option-aria aria">Host controls</div>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M720-240q25 0 42.5-17.5T780-300q0-25-17.5-42.5T720-360q-25 0-42.5 17.5T660-300q0 25 17.5 42.5T720-240Zm0 120q30 0 56-14t43-39q-23-14-48-20.5t-51-6.5q-26 0-51 6.5T621-173q17 25 43 39t56 14ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM490-80H240q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v52q-18-6-37.5-9t-42.5-3v-40H240v400h212q8 24 16 41.5T490-80Zm230 40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM240-560v400-400Z" />
              </svg>
            </div>
          )}
        </div>
      )}

      <div className="video-call-actions">
        {screenWidth > 950 && (
          <div className="video-call-time-info">
            <div className="video-current-time">{currentTime}</div>
            <span>|</span>
            <div className="video-call-id">
              {callDetails?.id?.split("-")[0]}
            </div>
          </div>
        )}

        <div className="call-actions-btn">
          {/* VIDEO */}
          <div
            className="video-call-action"
            style={isCameraOn ? {} : { backgroundColor: "#521919ce" }}
          >
            {screenWidth > 500 ? (
              <>
                <div className="devices-more-option">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
                  </svg>
                </div>
                <div
                  className="devices-icon"
                  style={isCameraOn ? {} : { backgroundColor: "#e98d8dce" }}
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
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          {/* AUDIO */}
          <div
            className="video-call-action"
            onClick={() => setIsAudioOn((prev) => !prev)}
            style={isAudioOn ? {} : { backgroundColor: "#e98d8dce" }}
          >
            {screenWidth > 500 ? (
              <>
                <div className="devices-more-option">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
                  </svg>
                </div>
                <div
                  className="devices-icon"
                  style={isAudioOn ? {} : { backgroundColor: "#e98d8dce" }}
                >
                  {isAudioOn ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="30px"
                      viewBox="0 -960 960 960"
                      width="30px"
                      fill="#e3e3e3"
                    >
                      <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="30px"
                      viewBox="0 -960 960 960"
                      width="30px"
                      fill="#e3e3e3"
                    >
                      <path d="m710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM480-594Zm112 112-72-72v-206q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v126l-80-80v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-123q-104-14-172-93t-68-184h80q0 83 57.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 39T520-243v123h-80Zm352 64L56-792l56-56 736 736-56 56Z" />
                    </svg>
                  )}
                </div>
              </>
            ) : (
              <>
                {isAudioOn ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="30px"
                    fill="#e3e3e3"
                  >
                    <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="30px"
                    viewBox="0 -960 960 960"
                    width="30px"
                    fill="#e3e3e3"
                  >
                    <path d="m710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM480-594Zm112 112-72-72v-206q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v126l-80-80v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-123q-104-14-172-93t-68-184h80q0 83 57.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 39T520-243v123h-80Zm352 64L56-792l56-56 736 736-56 56Z" />
                  </svg>
                )}
              </>
            )}
          </div>
          {/* SCREEN SHARE */}
          {screenWidth > 500 && (
            <div className="video-call-share-screen">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M320-400h80v-80q0-17 11.5-28.5T440-520h80v80l120-120-120-120v80h-80q-50 0-85 35t-35 85v80ZM160-240q-33 0-56.5-23.5T80-320v-440q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v440q0 33-23.5 56.5T800-240H160Zm0-80h640v-440H160v440Zm0 0v-440 440ZM40-120v-80h880v80H40Z" />
              </svg>
            </div>
          )}
          {/* REACTION */}
          <div
            className={`video-call-reaction ${
              isReactionOpen ? "reaction-tab-open" : ""
            }`}
            onClick={() => setIsReactionOpen((prev) => !prev)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="30px"
              viewBox="0 -960 960 960"
              width="30px"
              fill="#e3e3e3"
            >
              <path d="M620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 260q68 0 123.5-38.5T684-400H276q25 63 80.5 101.5T480-260Zm0 180q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" />
            </svg>
          </div>

          {/* CAPTION */}
          {screenWidth > 500 && (
            <div className="video-call-caption">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M200-160q-33 0-56.5-23.5T120-240v-480q0-33 23.5-56.5T200-800h560q33 0 56.5 23.5T840-720v480q0 33-23.5 56.5T760-160H200Zm0-80h560v-480H200v480Zm80-120h120q17 0 28.5-11.5T440-400v-40h-60v20h-80v-120h80v20h60v-40q0-17-11.5-28.5T400-600H280q-17 0-28.5 11.5T240-560v160q0 17 11.5 28.5T280-360Zm280 0h120q17 0 28.5-11.5T720-400v-40h-60v20h-80v-120h80v20h60v-40q0-17-11.5-28.5T680-600H560q-17 0-28.5 11.5T520-560v160q0 17 11.5 28.5T560-360ZM200-240v-480 480Z" />
              </svg>
            </div>
          )}

          {/* HAND */}
          {screenWidth > 500 && (
            <div
              className={`video-call-hand ${
                isHandRaised ? "video-call-hand-active" : ""
              }`}
              onClick={() => setIsHandRaised((prev) => !prev)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M480-480v-400q0-17 11.5-28.5T520-920q17 0 28.5 11.5T560-880v400h-80Zm-160 0v-360q0-17 11.5-28.5T360-880q17 0 28.5 11.5T400-840v360h-80ZM500-40q-142 0-241-99t-99-241v-380q0-17 11.5-28.5T200-800q17 0 28.5 11.5T240-760v380q0 109 75.5 184.5T500-120q109 0 184.5-75.5T760-380v-140q-17 0-28.5 11.5T720-480v160H600q-33 0-56.5 23.5T520-240v40h-80v-40q0-66 47-113t113-47h40v-400q0-17 11.5-28.5T680-840q17 0 28.5 11.5T720-800v207q10-3 19.5-5t20.5-2h80v220q0 142-99 241T500-40Zm40-320Z" />
              </svg>
            </div>
          )}

          <div
            className="video-call-more-action"
            onClick={() => setIsToolBoxOpen(true)}
          >
            {screenWidth <= 500 && isMessageUnseen && (
              <div className="unseen-message"></div>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="30px"
              viewBox="0 -960 960 960"
              width="30px"
              fill="#e3e3e3"
            >
              <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" />
            </svg>
          </div>
          {screenWidth < 500 && <div className="separater">|</div>}
          <div className="call-end-btn" onClick={endCall}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="30px"
              viewBox="0 -960 960 960"
              width="30px"
              fill="#e3e3e3"
            >
              <path d="m136-304-92-90q-12-12-12-28t12-28q88-95 203-142.5T480-640q118 0 232.5 47.5T916-450q12 12 12 28t-12 28l-92 90q-11 11-25.5 12t-26.5-8l-116-88q-8-6-12-14t-4-18v-114q-38-12-78-19t-82-7q-42 0-82 7t-78 19v114q0 10-4 18t-12 14l-116 88q-12 9-26.5 8T136-304Zm104-198q-29 15-56 34.5T128-424l40 40 72-56v-62Zm480 2v60l72 56 40-38q-29-26-56-45t-56-33Zm-480-2Zm480 2Z" />
            </svg>
          </div>
        </div>

        {/* video-call more info */}
        {screenWidth > 1190 && (
          <div className="video-call-detail-info">
            <div className="call-details detail-info1">
              <div className="call-details-aria aria">meeting details</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
              </svg>
            </div>
            <div className="people-info detail-info1">
              <div className="people-info-aria aria">People</div>
              <div className="people-count">{2}</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm720 0v-120q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v120H760ZM360-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm400-160q0 66-47 113t-113 47q-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113ZM120-240h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0 320Zm0-400Z" />
              </svg>
            </div>
            <div
              className={`chat-with-people detail-info1 ${
                isOpenMessageBox ? "btn-active" : ""
              }`}
              onClick={() => {
                setIsMessageUnseen(false);
                setIsOpenMessageBox(true);
                isOpenMessageBoxRef.current = true;
                setIsToolBoxOpen(false);
              }}
            >
              {isMessageUnseen && <div className="unseen-message"></div>}

              <div className="chat-with-people-aria aria">
                Chat with everyone
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
              </svg>
            </div>
            <div className="call-tools detail-info1">
              <div className="call-tools-aria aria">Meeting tools</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M240-160q-33 0-56.5-23.5T160-240q0-33 23.5-56.5T240-320q33 0 56.5 23.5T320-240q0 33-23.5 56.5T240-160Zm240 0q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm240 0q-33 0-56.5-23.5T640-240q0-33 23.5-56.5T720-320q33 0 56.5 23.5T800-240q0 33-23.5 56.5T720-160ZM240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400ZM240-640q-33 0-56.5-23.5T160-720q0-33 23.5-56.5T240-800q33 0 56.5 23.5T320-720q0 33-23.5 56.5T240-640Zm240 0q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Zm240 0q-33 0-56.5-23.5T640-720q0-33 23.5-56.5T720-800q33 0 56.5 23.5T800-720q0 33-23.5 56.5T720-640Z" />
              </svg>
            </div>
            {callDetails?.caller?.id === currentUser?.id && (
              <div className="host-option detail-info1">
                <div className="host-option-aria aria">Host controls</div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M720-240q25 0 42.5-17.5T780-300q0-25-17.5-42.5T720-360q-25 0-42.5 17.5T660-300q0 25 17.5 42.5T720-240Zm0 120q30 0 56-14t43-39q-23-14-48-20.5t-51-6.5q-26 0-51 6.5T621-173q17 25 43 39t56 14ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM490-80H240q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v52q-18-6-37.5-9t-42.5-3v-40H240v400h212q8 24 16 41.5T490-80Zm230 40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM240-560v400-400Z" />
                </svg>
              </div>
            )}
          </div>
        )}
        {screenWidth < 1190 && screenWidth > 500 && (
          <div className="show-video-call-details-info">
            <div
              className="icon1"
              onClick={() => setIsShowCallDetails((prev) => !prev)}
            >
              <div className="show-video-aria aria">More options</div>
              {isShowCallDetails ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCallScreen;
