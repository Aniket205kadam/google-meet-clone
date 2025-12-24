import { useEffect, useRef, useState } from "react";
import "./BeforeCall.css";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import UserService from "../../services/UserService";
import PageDataLoader from "../../utils/loader/pageDataLoader/PageDataLoader";
import { toast } from "react-toastify";
import Logo from "../../assets/logo/logo.png";
import MicAnimation from "../../utils/mic/MicAnimation";
import { useWindowWidth } from "../../hooks/useWindowWidth.js";

const BeforeCall = () => {
  const { targetUserId } = useParams();
  const [currentUser, setCurrentUser] = useState();
  const accessToken = useSelector((state) => state.authentication.accessToken);
  const userService = new UserService(accessToken);
  const [targetUser, setTargetUser] = useState();
  const [loading, setLoading] = useState(true);
  const currentUserCameraRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const navigate = useNavigate();
  const [cameraInfo, setCameraInfo] = useState({
    currentUsed: "",
    available: [],
  });
  const [microphoneInfo, setMicrophoneInfo] = useState({
    currentUsed: "",
    available: [],
  });
  const [speakerInfo, setSpeakerInfo] = useState({
    currentUsed: "",
    available: [],
  });
  const [isGotIt, setIsGotIt] = useState(false);
  const width = useWindowWidth();

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isCameraOn,
        audio: isAudioOn,
      });
      streamRef.current = stream;
      currentUserCameraRef.current.srcObject = stream;
      await currentUserCameraRef.current.play();
    } catch (error) {
      console.error("Failed to get access of camera!:", error);
    }
  };

  const stopCamera = () => {
    const stream = currentUserCameraRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      currentUserCameraRef.current.srcObject = null;
    }
  };

  const getUserByToken = async () => {
    try {
      const response = await userService.fetchUserByToken();
      setCurrentUser(response);
    } catch (error) {
      console.error("Failed to get current user:", error);
    }
  };

  const getUserById = async () => {
    try {
      setLoading(true);
      const response = await userService.fetchUserById(targetUserId);
      setTargetUser(response);
    } catch (error) {
      console.error("Failed to fetch user by Id", error);
      toast.error("Failed to fetch user by Id");
    } finally {
      setLoading(false);
    }
  };

  const getDevicesInfo = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameraInfo = devices.filter((d) => d.kind === "videoinput");
      const microPhonesInfo = devices.filter((d) => d.kind === "audioinput");
      const speakerInfo = devices.filter((d) => d.kind === "audiooutput");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      const activeCameraId = videoTrack.getSettings().deviceId;

      // Get active microphone
      const audioTrack = stream.getAudioTracks()[0];
      const activeMicId = audioTrack.getSettings().deviceId;

      setCameraInfo({
        currentUsed: activeCameraId,
        available: cameraInfo,
      });
      setSpeakerInfo({
        currentUsed: "",
        available: speakerInfo,
      });
      setMicrophoneInfo({
        currentUsed: activeMicId,
        available: microPhonesInfo,
      });
    } catch (error) {
      console.error("Permission denied or device error:", error);
    }
  };

  useEffect(() => {
    getUserByToken();
    getUserById();
    getDevicesInfo();
  }, [targetUserId]);

  useEffect(() => {
    if (currentUserCameraRef.current) {
      startCamera();
    }
  }, [isAudioOn, isCameraOn, currentUserCameraRef.current]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (loading) {
    return (
      <div className="before-call-page-loading">
        <PageDataLoader />
      </div>
    );
  } else {
    if (width > 500) {
      return (
        <div className="before-call-page-desktop">
          <div className="before-call-page-header1">
            <div className="app-name-header">
              <div className="icon-image">
                <img src={Logo} />
              </div>
              <span className="app-first-name">Google</span>
              <span className="app-second-name">Meet</span>
            </div>
            <div className="user-details-before-page">
              <div className="user-info-before-page">
                <div className="user-details-email">{currentUser?.email}</div>
                <div className="switch-account-option">Switch account</div>
              </div>
              <div className="user-info-profile-img">
                <img src={currentUser?.profile} />
              </div>
            </div>
          </div>
          <div className="main-before-call-page-desktop1">
            <div className="desktop-camera-view">
              <div className="camera-view-d">
                <div className="camera-d-more-option">
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
                <div className="audio-animation-container">
                  <MicAnimation />
                </div>
                <div className="camera-d-camera-actions">
                  <div
                    className={`d-camera-action ${isAudioOn ? "" : "off"}`}
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
                    className={`d-camera-action ${isCameraOn ? "" : "off"}`}
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
                </div>
                <div className="camera-view-name">{currentUser?.fullName}</div>
                <video ref={currentUserCameraRef} playsInline autoPlay muted />
              </div>
              <div className="choices-devices">
                <div className="choice-device">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
                    </svg>
                  </span>
                  <span>
                    {
                      microphoneInfo.available?.find(
                        (m) => m.deviceId === microphoneInfo.currentUsed
                      )?.label
                    }
                  </span>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M480-360 280-560h400L480-360Z" />
                    </svg>
                  </span>
                </div>

                <div className="choice-device">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z" />
                    </svg>
                  </span>
                  <span>{speakerInfo.available[0]?.label}</span>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M480-360 280-560h400L480-360Z" />
                    </svg>
                  </span>
                </div>

                <div className="choice-device">
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
                    </svg>
                  </span>
                  <span>
                    {
                      cameraInfo.available?.find(
                        (c) => c.deviceId === cameraInfo.currentUsed
                      )?.label
                    }
                  </span>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e3e3e3"
                    >
                      <path d="M480-360 280-560h400L480-360Z" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
            <div className="desktop-call-options">
              <h1>Ready to call?</h1>
              <div className="btn-call-desktop">
                <button
                  className="desktop-voice-call"
                  onClick={() => navigate(`/audio-calling/${targetUser.id}`)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z" />
                  </svg>
                  Voice call
                </button>
                <button
                  className="desktop-video-call"
                  onClick={() => {
                    if (streamRef.current) {
                      streamRef.current
                        .getTracks()
                        .forEach((track) => track.stop());
                      streamRef.current = null;
                    }
                    navigate(
                      `/video-calling/${targetUser.id}/video/${isCameraOn}/audio/${isAudioOn}`
                    );
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
                  </svg>
                  Video call
                </button>
              </div>
              <p className="call-as">Calling as {currentUser?.email}</p>
              {!isGotIt && (
                <div className="calling-warning">
                  <div className="warning-info">
                    <h6>
                      You're calling with your Google Account and phone number
                    </h6>
                    <p>
                      People you're calling might be able to see you email
                      address and phone number.
                    </p>
                    <p className="learn-more1">Learn more</p>
                  </div>
                  <button className="got-it" onClick={() => setIsGotIt(true)}>
                    Got it
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="before-call-page">
          <div className="before-call-heading">
            <div className="before-call-back-btn" onClick={() => navigate(-1)}>
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
            <div className="remote-user">
              <div className="remote-user-info">
                <img src={targetUser.profile} />
                <span className="remote-email">{targetUser.email}</span>
              </div>
            </div>
            <div className="before-call-more">
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
          <div className="before-call-main">
            <div className="current-user-camera-preview">
              <video ref={currentUserCameraRef} muted />
              <div className="current-video-option">
                <div
                  className="cv-option"
                  onClick={() => setIsCameraOn((prev) => !prev)}
                >
                  {isCameraOn ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="40px"
                      viewBox="0 -960 960 960"
                      width="40px"
                      fill="#e3e3e3"
                    >
                      <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="40px"
                      viewBox="0 -960 960 960"
                      width="40px"
                      fill="#e3e3e3"
                    >
                      <path d="M880-260 720-420v67l-80-80v-287H353l-80-80h367q33 0 56.5 23.5T720-720v180l160-160v440ZM822-26 26-822l56-56L878-82l-56 56ZM498-575ZM382-464ZM160-800l80 80h-80v480h480v-80l80 80q0 33-23.5 56.5T640-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Z" />
                    </svg>
                  )}
                </div>
                <div
                  className="cv-option"
                  onClick={() => setIsAudioOn((prev) => !prev)}
                >
                  {isAudioOn ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="40px"
                      viewBox="0 -960 960 960"
                      width="40px"
                      fill="#e3e3e3"
                    >
                      <path d="M480-400q-50 0-85-35t-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35Zm0-240Zm-40 520v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Zm40-360q17 0 28.5-11.5T520-520v-240q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v240q0 17 11.5 28.5T480-480Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="40px"
                      viewBox="0 -960 960 960"
                      width="40px"
                      fill="#e3e3e3"
                    >
                      <path d="m710-362-58-58q14-23 21-48t7-52h80q0 44-13 83.5T710-362ZM480-594Zm112 112-72-72v-206q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760v126l-80-80v-46q0-50 35-85t85-35q50 0 85 35t35 85v240q0 11-2.5 20t-5.5 18ZM440-120v-123q-104-14-172-93t-68-184h80q0 83 57.5 141.5T480-320q34 0 64.5-10.5T600-360l57 57q-29 23-63.5 39T520-243v123h-80Zm352 64L56-792l56-56 736 736-56 56Z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="call-options">
            <div
              className="voice-call-btn"
              onClick={() => navigate(`/audio-calling/${targetUser.id}`)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#e3e3e3"
              >
                <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z" />
              </svg>
            </div>
            <div
              className="video-call-btn"
              onClick={() => {
                if (streamRef.current) {
                  streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
                  streamRef.current = null;
                }
                navigate(
                  `/video-calling/${targetUser.id}/video/${isCameraOn}/audio/${isAudioOn}`
                );
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#e3e3e3"
              >
                <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
              </svg>
              <span>Call</span>
            </div>
          </div>
        </div>
      );
    }
  }
};

export default BeforeCall;
