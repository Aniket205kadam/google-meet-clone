import { useContext, useEffect, useRef, useState } from "react";
import "./VideoCallScreen.css";
import ToolBox from "../../components/videoCallScreen/toolBox/ToolBox";
import useClickOutside from "../../hooks/useClickOutside";
import InCallMessages from "../../components/inCallMessages/InCallMessages";
import { useParams } from "react-router-dom";
import PageDataLoader from "../../utils/loader/pageDataLoader/PageDataLoader";
import { useSelector } from "react-redux";
import CallService from "../../services/CallService";
import { toast } from "react-toastify";
import UserService from "../../services/UserService";
import { WebSocketContext } from "../../components/webSocket/WebSocketProvider";

const VideoCallScreen = () => {
  const { callId } = useParams();
  const { stompClient, isStompConnected } = useContext(WebSocketContext);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useSelector((state) => state.authentication);
  const callService = new CallService(accessToken);
  const userService = new UserService(accessToken);
  const [callInfo, setCallInfo] = useState({});
  const [connectedUser, setConnectedUser] = useState({});
  const [isCaller, setIsCaller] = useState();
  const [callerUser, setCallerUser] = useState();
  const [receiverUser, setReceiverUser] = useState({});

  const remoteUserImg =
    "https://images.unsplash.com/photo-1587723958656-ee042cc565a1?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687";
  const remoteUsername = "Aniket Kadam";
  const isSoundOn = true;
  const currentUser = {
    profileUrl:
      "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg",
  };

  const isRemoteUserCameraOff = false;

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(true);
  const [isToolBoxOpen, setIsToolBoxOpen] = useState(false);
  const toolBoxRef = useRef(null);
  const [isReactionOpen, setIsReactionOpen] = useState(false);

  const [isOnlyDisplayMain, setIsOnlyDisplayMain] = useState(false);
  const [isOpenMessageBox, setIsOpenMessageBox] = useState(false);

  const localCameraStreamRef = useRef(null);
  const peerRef = useRef(null);
  const remoteCameraStreamRef = useRef(null);

  const getCameraStream = async () => {
    if (localCameraStreamRef.current) return localCameraStreamRef.current;
    try {
      if (localCameraStreamRef.current) {
        localCameraStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
        localCameraStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localCameraStreamRef.current = stream;
      if (localCameraStreamRef.current)
        localCameraStreamRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Error accessing camera/mic:", err);
      toast.error("Error to access camera/mic stream.");
    }
  };

  const fetchConnectedUser = async () => {
    try {
      const response = await userService.fetchUserByToken();
      setConnectedUser(response);
    } catch (error) {
      toast.error("Failed to fetch connected user.");
    }
  };

  const fetchCallById = async () => {
    try {
      const response = await callService.fetchCallById(callId);
      setCallInfo(response);
    } catch (error) {
      toast.error("Failed to get call details");
    }
  };

  const createPeerConnection = () => {
    if (peerRef.current) {
      peerRef.current.close();
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    peerRef.current = peerConnection;

    if (localCameraStreamRef.current) {
      localCameraStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localCameraStreamRef.current);
      });
    }

    peerConnection.ontrack = (event) => {
      console.log("Remote camera access coming🎉: ", event.streams[0]);
      if (remoteCameraStreamRef.current) {
        remoteCameraStreamRef.current.srcObject = event.streams[0];

        // console.log("Remote camera access coming🎉: ", event.streams[0]);

        remoteCameraStreamRef.current.onloadedmetadata = () => {
          remoteCameraStreamRef.current
            .play()
            .catch((err) => console.error("Auto-play error:", err));
        };
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && stompClient.current?.connected) {
        stompClient.current.send(
          "/app/webrtc",
          {},
          JSON.stringify({
            callId: callId,
            from: connectedUser.email,
            to: isCaller ? receiverUser.email : callerUser.email,
            type: "candidate",
            candidate: event.candidate,
          })
        );
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
      if (peerConnection.connectionState === "connected") {
      } else if (
        peerConnection.connectionState === "disconnected" ||
        peerConnection.connectionState === "failed"
      ) {
      }
    };
    return peerConnection;
  };

  const handleOffer = async (data) => {
    try {
      // Create peer connection if it doesn't exist
      if (!peerRef.current) {
        await getCameraStream();
        createPeerConnection();
      }

      const peerConnection = peerRef.current;

      // Set remote description
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "offer", sdp: data.sdp })
      );

      // Create and set local answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer back to caller
      if (stompClient.current?.connected) {
        stompClient.current.send(
          "/app/webrtc",
          {},
          JSON.stringify({
            callId: callId,
            from: connectedUser.email,
            to: callerUser.email,
            type: "answer",
            sdp: answer.sdp,
          })
        );
      }
      setLoading(true);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  const handleAnswer = async (data) => {
    try {
      if (!peerRef.current) {
        console.warn("No peer connection for answer");
        return;
      }

      const peerConnection = peerRef.current;
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: data.sdp })
      );
      setLoading(true);
      // console.log("Answer received and remote description set");
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };

  const handleCandidate = async (data) => {
    try {
      if (!peerRef.current) {
        // console.warn("Peer connection not established yet");
        return;
      }
      const peerConnection = peerRef.current;
      const candidate = new RTCIceCandidate(data.candidate);
      await peerConnection.addIceCandidate(candidate);
      // console.log("ICE candidate added:", candidate);
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  };

  const onSignal = async (data) => {
    try {
      console.log("Received signal:", data.type);

      switch (data.type) {
        case "offer":
          console.log("offer come");
          await handleOffer(data);
          break;
        case "answer":
          console.log("answer come");
          await handleAnswer(data);
          break;
        case "candidate":
          console.log("candidate come");
          await handleCandidate(data);
          break;
        default:
          console.error("Unknown signal type: ", data.type);
      }
    } catch (error) {
      console.error("Error processing signal:", error);
    }
  };

  const createWebRtcConnection = async () => {
    try {
      await getCameraStream();

      const peerConnection = createPeerConnection();

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (stompClient.current?.connected) {
        stompClient.current.send(
          "/app/webrtc",
          {},
          JSON.stringify({
            callId: callId,
            from: connectedUser.email,
            to: receiverUser.email,
            type: "offer",
            sdp: offer.sdp,
          })
        );
      }
    } catch (error) {}
  };

  useEffect(() => {
    fetchCallById();
    fetchConnectedUser();
    getCameraStream();
  }, [callId]);

  useEffect(() => {
    if (!connectedUser?.email || !callInfo?.caller) return;

    const isUserCaller = connectedUser.email === callInfo.caller.email;
    setIsCaller(isUserCaller);
    setCallerUser(callInfo.caller);
    setReceiverUser(callInfo.receiver);
  }, [connectedUser, callInfo, stompClient]);

  useEffect(() => {
    const checkConnectionAndStart = async () => {
      if (isStompConnected) {
        if (isCaller) {
          console.log("Send connection request");
          await createWebRtcConnection();
        } else {
          console.log("Wait for connection");
        }
      }
    };

    checkConnectionAndStart();
  }, [isCaller, isStompConnected]);

  useEffect(() => {
    if (
      stompClient?.current &&
      stompClient.current.connected &&
      connectedUser?.email?.length > 0
    ) {
      stompClient.current.subscribe(
        `/topic/webrtc/connection/${connectedUser.email}`,
        (message) => {
          const data = JSON.parse(message.body);
          console.log(data);
          onSignal(data);
        }
      );
    }
  }, [connectedUser]);

  // when click outside the tool box then close tool box
  useClickOutside(toolBoxRef, () => setIsToolBoxOpen(false));

  if (loading) {
    return (
      <div className="loading-screen">
        <PageDataLoader />
      </div>
    );
  }

  return (
    <div className="video-call-screen-page">
      {/* In call messages */}
      {isOpenMessageBox && (
        <InCallMessages
          onClose={() => setIsOpenMessageBox(false)}
          currentUser={{
            profileUrl:
              "https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
          }}
          remoteUser={{
            fullName: "Rohit",
            profileUrl:
              "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
          }}
        />
      )}

      {/* Tool box */}
      {isToolBoxOpen && (
        <ToolBox
          ref={toolBoxRef}
          isHandRaised={isHandRaised}
          isSoundOn={isSoundOn}
          openMessageBox={() => {
            setIsOpenMessageBox(true);
            setIsToolBoxOpen(false);
          }}
          onClose={() => setIsToolBoxOpen(false)}
        />
      )}

      <div
        className="video-call-screen-heading"
        style={isOnlyDisplayMain ? { opacity: "0" } : { opacity: "1" }}
      >
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
          <div className="remote-user-profile">
            <img src={remoteUserImg} className="user-profile-img" />
            <span className="user-profile-name">{remoteUsername}</span>
          </div>
        </div>
        <div className="video-call-right">
          {isSoundOn ? (
            <div className="sound-icon">
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
            <div className="volume-icon">
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
      <div
        className="video-call-main"
        onClick={() => setIsOnlyDisplayMain((prev) => !prev)}
      >
        {isRemoteUserCameraOff ? (
          <div className="remote-user-camera-off">
            <img src={remoteUserImg} />
          </div>
        ) : (
          <video
            ref={remoteCameraStreamRef}
            className="remote-user-video"
          />
        )}

        <div className="current-user-video">
          {isCameraOn ? (
            <video
              ref={localCameraStreamRef}
              className="cuser-video"
            />
          ) : (
            <div className="curr-user-camera-off">
              <img src={currentUser.profileUrl} />
            </div>
          )}

          {isHandRaised && (
            <div className="is-hand-raised">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#000000"
              >
                <path d="M480-480v-400q0-17 11.5-28.5T520-920q17 0 28.5 11.5T560-880v400h-80Zm-160 0v-360q0-17 11.5-28.5T360-880q17 0 28.5 11.5T400-840v360h-80ZM500-40q-142 0-241-99t-99-241v-380q0-17 11.5-28.5T200-800q17 0 28.5 11.5T240-760v380q0 109 75.5 184.5T500-120q109 0 184.5-75.5T760-380v-140q-17 0-28.5 11.5T720-480v160H600q-33 0-56.5 23.5T520-240v40h-80v-40q0-66 47-113t113-47h40v-400q0-17 11.5-28.5T680-840q17 0 28.5 11.5T720-800v207q10-3 19.5-5t20.5-2h80v220q0 142-99 241T500-40Zm40-320Z" />
              </svg>
            </div>
          )}

          {!isAudioOn && (
            <div className="audio-off">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="#e3e3e3"
              >
                <path d="m710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM480-594Zm112 112-72-72v-206q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v126l-80-80v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-123q-104-14-172-93t-68-184h80q0 83 57.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 39T520-243v123h-80Zm352 64L56-792l56-56 736 736-56 56Z" />
              </svg>
            </div>
          )}

          <div className="current-video-more">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" />
            </svg>
          </div>
        </div>
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
        <span className="emoji">💖</span>
        <span className="emoji">👍</span>
        <span className="emoji">🎉</span>
        <span className="emoji">👏</span>
        <span className="emoji">😂</span>
        <span className="emoji">😯</span>
        <span className="emoji">😥</span>
        <span className="emoji">🤔</span>
        <span className="emoji">👎</span>
      </div>

      <div
        className="video-call-actions"
        style={isOnlyDisplayMain ? { opacity: "0" } : { opacity: "1" }}
      >
        <div className="call-actions-btn">
          <div
            className="video-call-action"
            onClick={() => setIsCameraOn((prev) => !prev)}
            style={isCameraOn ? {} : { backgroundColor: "#e98d8dce" }}
          >
            {isCameraOn ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="30px"
                viewBox="0 -960 960 960"
                width="30px"
                fill="#e3e3e3"
              >
                <path d="M240-320h320v-22q0-44-44-71t-116-27q-72 0-116 27t-44 71v22Zm160-160q33 0 56.5-23.5T480-560q0-33-23.5-56.5T400-640q-33 0-56.5 23.5T320-560q0 33 23.5 56.5T400-480ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="30px"
                viewBox="0 -960 960 960"
                width="30px"
                fill="#e3e3e3"
              >
                <path d="M880-260 720-420v67l-80-80v-287H353l-80-80h367q33 0 56.5 23.5T720-720v180l160-160v440ZM822-26 26-822l56-56L878-82l-56 56ZM497-577ZM384-464ZM160-800l80 80h-80v480h480v-80l80 80q0 33-23.5 56.5T640-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Zm80 480v-22q0-44 44-71t116-27q72 0 116 27t44 71v22H240Z" />
              </svg>
            )}
          </div>
          <div
            className="video-call-action"
            onClick={() => setIsAudioOn((prev) => !prev)}
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
          <div
            className="video-call-more-action"
            onClick={() => setIsToolBoxOpen(true)}
          >
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
          <div className="separater">|</div>
          <div className="call-end-btn">
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
      </div>
    </div>
  );
};

export default VideoCallScreen;
