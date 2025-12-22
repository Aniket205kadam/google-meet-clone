import { useContext, useState, useRef, useEffect } from "react";
import { WebSocketContext } from "../../../components/webSocket/WebSocketProvider";
import { useNavigate } from "react-router-dom";
import useClickOutside from "../../../hooks/useClickOutside";
import "./MeetingScreen.css";
import MediaDeviceService from "../../../services/MediaDeviceService";
import { useSelector } from "react-redux";
import UserAdd from "../../../assets/music/user-add.m4a";
import AddUser from "../../../components/meeting/addUser/AddUser";
import MeetingService from "../../../services/MeetingService";
import UserService from "../../../services/UserService";
import WebRtcConfig from "../../../config/WebRtcConfig";
import VideoTile from "../../../components/meeting/videoTile/VideoTile";
import Toast from "../../../components/toast/Toast";
import { toast } from "react-toastify";
import { useWindowWidth } from "../../../hooks/useWindowWidth";
import AppConfig from "../../../config/AppConfig";

const MeetingScreen = ({ meetingCode }) => {
  const { stompClient, isStompConnected } = useContext(WebSocketContext);
  const { accessToken } = useSelector((state) => state.authentication);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isToolBoxOpen, setIsToolBoxOpen] = useState(false);
  const toolBoxRef = useRef(null);
  const [isReactionOpen, setIsReactionOpen] = useState(false);
  const [isOnlyDisplayMain, setIsOnlyDisplayMain] = useState(false);
  const [isOpenMessageBox, setIsOpenMessageBox] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [currentReaction, setCurrentReaction] = useState({
    emoji: null,
    name: null,
  });
  const isOpenMessageBoxRef = useRef(false);
  const [isMessageUnseen, setIsMessageUnseen] = useState(false);
  const [isShowUserVideoOption, setIsShowUserVideoOption] = useState(false);
  const [isMinimizeUserVideo, setIsMinimizeUserVideo] = useState(false);
  const [isMeetLinkCopied, setIsMeetLinkCopied] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [inCallNewUserAdded, setInCallNewUserAdded] = useState(false);
  const [isShowParticipantsInfo, setIsShowParticipantsInfo] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const currentUserVideoOptionRef = useRef();
  const currentVideoRef = useRef(null);
  const currentVideoStreamRef = useRef(null);
  const navigate = useNavigate();

  const participantsRtcConnectionObjects = new Map();
  const [participantInfo, setParticipantInfo] = useState([]); // {stream: {...}, user: {...}}
  const participantsIce = new Map();
  const [isShowToast, setIsShowToast] = useState({
    isShow: false,
    image: "",
    description: "",
  });

  const screenWidth = useWindowWidth();

  const mediaDeviceService = new MediaDeviceService(accessToken);
  const meetingService = new MeetingService(accessToken);
  const userService = new UserService(accessToken);

  useClickOutside(toolBoxRef, () => setIsToolBoxOpen(false));
  useClickOutside(currentUserVideoOptionRef, () =>
    setIsShowUserVideoOption(false)
  );

  const getCameraStream = async () => {
    try {
      await mediaDeviceService.getCameraStream(
        currentVideoRef,
        currentVideoStreamRef,
        isCameraOn,
        isAudioOn
      );
    } catch (error) {
      console.error("Failed to get camera/mic stream");
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await userService.fetchUserByToken();
      setCurrentUser(response);
    } catch (error) {}
  };

  const fetchMeetingParticipants = async () => {
    try {
      const response = await meetingService.getMeetingParticipants(meetingCode);
      setParticipants(response);
    } catch (error) {}
  };

  const addInMeeting = async () => {
    try {
      await meetingService.addInMeeting(meetingCode);
    } catch (error) {
      toast.error("Failed to join the meeting!");
      navigate("/");
    }
  };

  const listeningWaitingUsers = () => {
    return stompClient.current.subscribe(
      `/topic/waiting/users/${meetingCode}/${currentUser.email}`,
      (request) => {
        const newUserAdded = JSON.parse(request.body);
        if (newUserAdded) {
          setInCallNewUserAdded(true);
        }
      }
    );
  };

  const currentUserIsAdmin = async () => {
    try {
      const response = await meetingService.isAdmin(meetingCode);
      setIsUserAdmin(response);
    } catch (error) {}
  };

  const fetchWaitingUsers = async () => {
    try {
      if (!isUserAdmin) return;
      const response = await meetingService.getWaitingUsersInMeeting(
        meetingCode
      );
      console.log(response);
      setInCallNewUserAdded(response.length > 0);
    } catch (error) {}
  };

  const fetchUserByEmail = async (email) => {
    try {
      return await userService.fetchUserByEmail(email);
    } catch (error) {
      console.error("Failed to fetch user by email:", error);
    }
  };

  const createPeerConnection = async (targetUser) => {
    const peerConnection = new RTCPeerConnection(WebRtcConfig);

    if (currentVideoStreamRef.current) {
      currentVideoStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, currentVideoStreamRef.current);
      });
    }

    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];

      setParticipantInfo((prev) => {
        const exists = prev.some((p) => p.user.email === targetUser.email);

        if (exists) {
          return prev.map((p) =>
            p.user.email === targetUser.email ? { ...p, stream } : p
          );
        }

        return [...prev, { user: targetUser, stream }];
      });
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && isStompConnected) {
        const candidateRequest = {
          callId: meetingCode,
          from: currentUser.email,
          to: targetUser.email,
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

  const sendOfferToTargetUser = async (participant) => {
    const targetUser = participant.user;

    if (participantsRtcConnectionObjects.has(targetUser.email)) {
      console.log("User has already been added");
      return;
    }

    const peerConnection = await createPeerConnection(targetUser);

    participantsRtcConnectionObjects.set(targetUser.email, peerConnection);

    const offer = await peerConnection.createOffer();
    console.log("Before ICE");
    await peerConnection.setLocalDescription(offer);
    console.log("After ICE");

    if (isStompConnected) {
      stompClient.current.send(
        "/app/webrtc",
        {},
        JSON.stringify({
          callId: meetingCode,
          from: currentUser.email,
          to: targetUser.email,
          type: "offer",
          sdp: offer.sdp,
        })
      );
    }

    setIsShowToast({
      isShow: true,
      image: targetUser.profile,
      description: `${targetUser.fullName.split(" ")[0]} joined the meeting.`,
    });
  };

  const handleOffer = async (data) => {
    try {
      console.log("Offer received:", data);

      const fromUser = await fetchUserByEmail(data.from);
      const email = fromUser.email;

      let peerConnection = participantsRtcConnectionObjects.get(email);
      if (!peerConnection) {
        peerConnection = await createPeerConnection(fromUser);
        participantsRtcConnectionObjects.set(email, peerConnection);
      }

      await peerConnection.setRemoteDescription({
        type: "offer",
        sdp: data.sdp,
      });

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      stompClient.current.send(
        "/app/webrtc",
        {},
        JSON.stringify({
          callId: meetingCode,
          from: currentUser.email,
          to: email,
          type: "answer",
          sdp: answer.sdp,
        })
      );

      if (participantsIce.has(email)) {
        const queued = participantsIce.get(email);
        for (const candidate of queued) {
          try {
            await peerConnection.addIceCandidate(candidate);
          } catch (err) {
            console.error("Failed to apply queued ICE:", err);
          }
        }
        participantsIce.delete(email);
      }

      setParticipants((prev) => {
        if (prev.some((p) => p.user.email === email)) return prev;
        return [
          ...prev,
          {
            id: fromUser.id,
            user: fromUser,
            admin: false,
            muted: false,
          },
        ];
      });
    } catch (error) {
      console.error("Failed to handle offer:", error);
    }
  };

  const handleAnswer = async (data) => {
    try {
      console.log("answer coming:", data);

      const targetUser = await fetchUserByEmail(data.from);

      if (!participantsRtcConnectionObjects.has(targetUser.email)) {
        console.warn(
          "Received an answer, but no matching RTCPeerConnection was found."
        );
        return;
      }
      const peerConnection = participantsRtcConnectionObjects.get(
        targetUser.email
      );
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: data.sdp })
      );
    } catch (error) {
      console.error("Failed to handle answer:", error);
    }
  };

  const handleCandidate = async (data) => {
    try {
      console.log("candidate coming:", data);

      const targetUser = await fetchUserByEmail(data.from);
      const email = targetUser.email;
      const candidate = new RTCIceCandidate(data.candidate);

      const peerConnection = participantsRtcConnectionObjects.get(email);

      if (!peerConnection || !peerConnection.remoteDescription) {
        if (!participantsIce.has(email)) {
          participantsIce.set(email, []);
        }
        participantsIce.get(email).push(candidate);
        return;
      }

      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error("Failed to add ice candidate:", error);
    }
  };

  const handleIncomingSignals = async (data) => {
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

      default:
        console.error("Unknown signal:", data.type);
        break;
    }
  };

  const removeParticipant = (participant) => {
    participantsRtcConnectionObjects.delete(participant.user.email);
    setParticipantInfo((prevParticipants) =>
      prevParticipants.filter((p) => p.user.id !== participant.user.id)
    );
    setIsShowToast({
      isShow: true,
      image: participant.user.profile,
      description: `${
        participant.user.fullName.split(" ")[0]
      } left the meeting.`,
    });
  };

  const stopMeeting = async () => {
    try {
      await meetingService.leftFromMeeting(meetingCode);
      navigate("/");
    } catch (error) {
      console.error("Failed to left the meeting:", error);
    }
  };

  const listeningUserRemoveFromMeeting = () => {
    return stompClient.current.subscribe(
      `/topic/meeting/${meetingCode}/participant/remove`,
      (request) => {
        const removedParticipant = JSON.parse(request.body);

        if (removedParticipant.user.email === currentUser.email) {
          return;
        }

        console.log("Participant remove from the call:", removedParticipant);
        removeParticipant(removedParticipant);
      }
    );
  };

  const listeningUserAddInMeeting = () => {
    return stompClient.current.subscribe(
      `/topic/meeting/${meetingCode}/participant/add`,
      (request) => {
        const newParticipant = JSON.parse(request.body);

        if (newParticipant.user.email === currentUser.email) {
          return;
        }

        console.log("New Participant add", newParticipant);
        sendOfferToTargetUser(newParticipant);
      }
    );
  };

  const listeningWebRtc = () => {
    return stompClient.current.subscribe(
      `/topic/webrtc/connection/${currentUser.email}`,
      (request) => {
        const packet = JSON.parse(request.body);
        handleIncomingSignals(packet);
      }
    );
  };

  const toggleTracks = (type, isEnabled) => {
    try {
      if (type === "video") {
        currentVideoStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = isEnabled;
        });

        cure;
      } else {
        currentVideoStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = isEnabled;
        });
      }
    } catch (error) {}
  };

  useEffect(() => {
    getCameraStream();

    return () => {
      mediaDeviceService.stopCameraStream(
        currentVideoStreamRef,
        currentVideoRef
      );
    };
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchMeetingParticipants();
    addInMeeting();
    currentUserIsAdmin();
    fetchWaitingUsers();
  }, []);

  useEffect(() => {
    if (isStompConnected && currentUser) {
      listeningUserAddInMeeting();
      listeningUserRemoveFromMeeting();
    }
  }, [stompClient, currentUser]);

  useEffect(() => {
    if (currentUser && isStompConnected) {
      listeningWaitingUsers();
    }
  }, [currentUser, isStompConnected]);

  useEffect(() => {
    toggleTracks("video", isCameraOn);
  }, [isCameraOn, participantInfo]);

  useEffect(() => {
    toggleTracks("audio", isAudioOn);
  }, [isAudioOn, participantInfo]);

  useEffect(() => {
    const handleUnload = () => {
      stopMeeting();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {
    if (isStompConnected && currentUser) {
      listeningWebRtc();
    }
  }, [isStompConnected, currentUser]);

  useEffect(() => {
    console.log("Participant stream and user info: ", participantInfo);
  }, [participantInfo]);

  useEffect(() => {
    let timeoutId;
    if (isShowToast.isShow) {
      timeoutId = setTimeout(() => {
        setIsShowToast({ isShow: false, image: "", description: "" });
      }, 4000);
    } else {
      clearTimeout(timeoutId);
    }
  }, [isShowToast.isShow]);

  return (
    <div className="meeting-screen-page">
      {/* display  participants info */}
      {isShowParticipantsInfo && (
        <AddUser
          meetingCode={meetingCode}
          setIsShowParticipantsInfo={setIsShowParticipantsInfo}
        />
      )}

      {/* display toast */}
      {isShowToast.isShow && (
        <Toast img={isShowToast.image} desc={isShowToast.description} />
      )}

      <div
        className="meeting-screen-heading"
        style={
          isOnlyDisplayMain
            ? { opacity: "0", display: "none" }
            : { opacity: "1" }
        }
      >
        <div className="meeting-screen-heading-left">
          <div className="meeting-screen-back meet-heading-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
            </svg>
          </div>
          <div
            className="meeting-code"
            onClick={(e) => {
              e.stopPropagation();
              setIsShowParticipantsInfo(true);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M320-400q-17 0-28.5-11.5T280-440q0-17 11.5-28.5T320-480q17 0 28.5 11.5T360-440q0 17-11.5 28.5T320-400Zm160 0q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm160 0q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
            </svg>
            {meetingCode}
          </div>
        </div>
        <div className="meeting-screen-heading-right">
          <div
            className="meeting-sound-btn meet-heading-btn"
            onClick={() => setIsSoundOn((prev) => !prev)}
          >
            {isSoundOn ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Zm-80 238v-94l-72-72H200v80h114l86 86Zm-36-130Z" />
              </svg>
            )}
          </div>
          <div className="meeting-camera-change meet-heading-btn">
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
        </div>
      </div>
      <div
        className="meeting-screen-main"
        onClick={() => setIsOnlyDisplayMain((prev) => !prev)}
      >
        {/* more options */}
        {isShowUserVideoOption && (
          <div
            className="current-user-video-options"
            onClick={(e) => e.stopPropagation()}
            ref={currentUserVideoOptionRef}
          >
            <span>You</span>
            <div className="line"></div>
            <div
              className="option1"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimizeUserVideo(true);
                setIsShowUserVideoOption(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="m136-80-56-56 264-264H160v-80h320v320h-80v-184L136-80Zm344-400v-320h80v184l264-264 56 56-264 264h184v80H480Z" />
              </svg>
              Minimize you video
            </div>
          </div>
        )}

        {/* is new user added */}
        {inCallNewUserAdded && (
          <div
            className="new-user-added"
            onClick={(e) => {
              e.stopPropagation();
              setIsShowParticipantsInfo(true);
              setInCallNewUserAdded(false);
            }}
          >
            <audio src={UserAdd} autoPlay />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-360-80q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z" />
            </svg>
          </div>
        )}

        <div
          className="participants-container"
          style={isOnlyDisplayMain ? { height: "100%", margin: "0" } : {}}
        >
          {participantInfo?.map((info, idx) => (
            <VideoTile
              idx={idx}
              isSoundOn={isSoundOn}
              stream={info.stream}
              user={info.user}
            />
          ))}

          {participants.length === 0 && participantInfo.length === 0 && (
            <div className="no-participants-container">
              <span className="heading-no-participant">
                You're the only one here
              </span>
              <p className="no-par-par">
                Share this meeting link with others that you want in the meeting
              </p>
              <div className="no-participant-meeting-code">
                <span>{`${AppConfig.appRoot}/${meetingCode}`}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard
                      .writeText(`${AppConfig.appRoot}/${meetingCode}`)
                      .then(() => setIsMeetLinkCopied(true));
                  }}
                >
                  {isMeetLinkCopied ? (
                    <div className="copied-succ">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#e3e3e3"
                      >
                        <path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z" />
                      </svg>
                    </div>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" />
                    </svg>
                  )}
                </button>
              </div>
              <button className="share-button1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm480-280q17 0 28.5-11.5T720-760q0-17-11.5-28.5T680-800q-17 0-28.5 11.5T640-760q0 17 11.5 28.5T680-720Zm0 520ZM200-480Zm480-280Z" />
                </svg>
                Share invite
              </button>
            </div>
          )}

          {/* current user video */}
          {isMinimizeUserVideo ? (
            <div
              className="current-user-hide"
              style={isOnlyDisplayMain ? { opacity: "0" } : {}}
            >
              <div className="audio1 current-video-op">
                {isAudioOn ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M280-240v-480h80v480h-80ZM440-80v-800h80v800h-80ZM120-400v-160h80v160h-80Zm480 160v-480h80v480h-80Zm160-160v-160h80v160h-80Z" />
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
              <div className="camera1 current-video-op">
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
              <span className="current-video-op">You</span>
              <div
                className="expand-user-video current-video-op"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimizeUserVideo(false);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M200-200v-240h80v160h160v80H200Zm480-320v-160H520v-80h240v240h-80Z" />
                </svg>
              </div>
            </div>
          ) : (
            <div
              className="current-user-video1"
              style={isOnlyDisplayMain ? { opacity: "0" } : {}}
            >
              <video ref={currentVideoRef} playsInline autoPlay muted />
              <div className="current-user-video-wrapper">
                <span className="current-video-label">You</span>
                <div
                  className="current-user-more-option current-user-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShowUserVideoOption(true);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#ffffff"
                  >
                    <path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" />
                  </svg>
                </div>
                <div className="current-user-background-change current-user-btn">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M120-574v-85l181-181h85L120-574Zm0-196v-70h70l-70 70Zm527 67q-10-11-21.5-21.5T602-743l97-97h85L647-703ZM220-361l77-77q7 11 14.5 20t16.5 17q-28 7-56.5 17.5T220-361Zm480-197v-2q0-19-3-37t-9-35l152-152v86L700-558ZM436-776l65-64h85l-64 64q-11-2-21-3t-21-1q-11 0-22 1t-22 3ZM120-375v-85l144-144q-2 11-3 22t-1 22q0 11 1 21t3 20L120-375Zm709 83q-8-12-18.5-23T788-335l52-52v85l-11 10Zm-116-82q-7-3-14-5.5t-14-4.5q-9-3-17.5-6t-17.5-5l190-191v86L713-374Zm-233-26q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480ZM160-120v-71q0-34 17-63t47-44q51-26 115.5-44T480-360q76 0 140.5 18T736-298q30 15 47 44t17 63v71H160Zm81-80h478q-2-9-7-15.5T699-226q-36-18-91.5-36T480-280q-72 0-127.5 18T261-226q-8 4-13 11t-7 15Zm239 0Zm0-360Z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        className="meet-call-actions"
        style={isOnlyDisplayMain ? { display: "none" } : {}}
      >
        <div className="call-actions-btn1">
          <div
            className="video-call-action1"
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
            className="video-call-action1"
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
            className="video-call-action1 meeting-info"
            onClick={(e) => {
              e.stopPropagation();
              setIsShowParticipantsInfo(true);
            }}
          >
            <div className="participant-count">{participantInfo?.length + 1}</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="30px"
              viewBox="0 -960 960 960"
              width="30px"
              fill="#e3e3e3"
            >
              <path d="M0-240v-63q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v63H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z" />
            </svg>
          </div>
          {screenWidth <= 500 && <div className="separater">|</div>}
          <div className="meet-end-btn" onClick={stopMeeting}>
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

export default MeetingScreen;
