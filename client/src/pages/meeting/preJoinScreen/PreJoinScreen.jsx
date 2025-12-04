import { useContext, useEffect, useRef, useState } from "react";
import "./PreJoinScreen.css";
import { useNavigate, useParams } from "react-router-dom";
import MediaDeviceService from "../../../services/MediaDeviceService";
import { useSelector } from "react-redux";
import UserService from "../../../services/UserService";
import MeetingService from "../../../services/MeetingService";
import { toast } from "react-toastify";
import { WebSocketContext } from "../../../components/webSocket/WebSocketProvider";

const PreJoinScreen = ({ meetingCode, setIsUserReadyToJoin }) => {
  const { stompClient, isStompConnected } = useContext(WebSocketContext);

  const [connectedUser, setConnectedUser] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isAskJoinLoading, setIsAskJoinLoading] = useState(false);
  const [isPermissionToJoin, setIsPermissionToJoin] = useState(false);

  const currentUserCameraRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const { accessToken } = useSelector((state) => state.authentication);

  const mediaDeviceService = new MediaDeviceService();
  const userService = new UserService(accessToken);
  const meetingService = new MeetingService(accessToken);

  let adminActionSubscribe = null;

  const startCamera = async () => {
    try {
      await mediaDeviceService.getCameraStream(
        currentUserCameraRef,
        streamRef,
        isCameraOn,
        isAudioOn
      );
    } catch (error) {
      console.error("Failed to access camera/mic stream.");
    }
  };

  const getConnectedUser = async () => {
    try {
      const response = await userService.fetchUserByToken();
      setConnectedUser(response);
    } catch (error) {
      console.error("Failed to get user data");
    }
  };

  const currentUserHasPermissionToJoin = async () => {
    try {
      const response = await meetingService.currentUserHasPermission(
        meetingCode
      );
      setIsPermissionToJoin(response);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setIsPermissionToJoin(false);
    }
  };

  const currentUserAskForJoin = async () => {
    try {
      listeningAdminAction();
      setIsAskJoinLoading(true);
      await meetingService.getPermissionFromAdmin(meetingCode);
    } catch (error) {
      setIsAskJoinLoading(false);
      toast.error("Failed to get permission from admin!");
    }
  };

  const listeningAdminAction = () => {
    adminActionSubscribe = stompClient.current.subscribe(
      `/topic/allowed/in/meeting/${meetingCode}/${connectedUser.id}`,
      () => {
        toast.success("Admin has allowed you to join the meeting.")
        setIsUserReadyToJoin(true);
      }
    );
  };

  useEffect(() => {
    getConnectedUser();
    currentUserHasPermissionToJoin();
    startCamera();
  }, []);

  return (
    <div className="pre-meeting-call-page">
      {(loading || isAskJoinLoading) && (
        <div className="pre-meeting-loading">
          <div className="loader1"></div>
        </div>
      )}
      <div className="pre-meeting-call-heading">
        <div className="pre-meeting-call-back-btn" onClick={() => navigate(-1)}>
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
        <div className="remote-meeting">
          {isAskJoinLoading ? (
            <div
              className="meeting-info"
              style={{
                display: "flex",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              Asking to join...
            </div>
          ) : (
            <div className="meeting-info">
              <div className="link-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e3e3e3"
                >
                  <path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z" />
                </svg>
              </div>
              <div className="meeting-code">{meetingCode}</div>
            </div>
          )}
        </div>
        <div className="pre-meeting-call-more">
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
      <div className="pre-meeting-call-main">
        <div className="current-user-camera-preview">
          <video ref={currentUserCameraRef} muted playsInline autoPlay />
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
        {connectedUser && (
          <div className="connected-user">
            <div className="connected-user-profile">
              <img src={connectedUser.profile} />
            </div>
            <span className="connected-user-email">{connectedUser?.email}</span>
          </div>
        )}
        <button className="meeting-join-button">
          {loading ? (
            <span>Setting up</span>
          ) : (
            <>
              {isPermissionToJoin ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignContent: "center",
                    gap: "10px",
                  }}
                  onClick={() => setIsUserReadyToJoin(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="40px"
                    viewBox="0 -960 960 960"
                    width="40px"
                    fill="#ffffff"
                  >
                    <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
                  </svg>
                  Join
                </div>
              ) : (
                <>
                  {isAskJoinLoading ? (
                    <>Cancel</>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "10px",
                      }}
                      onClick={currentUserAskForJoin}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="40px"
                        viewBox="0 -960 960 960"
                        width="40px"
                        fill="#ffffff"
                      >
                        <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z" />
                      </svg>
                      Ask to join
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PreJoinScreen;
