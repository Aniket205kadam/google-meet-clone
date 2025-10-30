import { useEffect, useState } from "react";
import "./AudioCalling.css";
import CallAction from "../../../utils/calling/action/CallAction";
import { useNavigate, useParams } from "react-router-dom";
import UserService from "../../../services/UserService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const AudioCalling = () => {
  const { targetUserId } = useParams();
  const [targetUser, setTargetUser] = useState({
    id: "",
    fullName: "",
    email: "",
    profile: "",
  });
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const accessToken = useSelector((state) => state.authentication.accessToken);
  const userService = new UserService(accessToken);
  const [callStatus, setCallStatus] = useState("calling"); // calling, ringing
  const navigate = useNavigate();

  const getUserById = async () => {
    try {
      const response = await userService.fetchUserById(targetUserId);
      setTargetUser(response);
    } catch (error) {
      toast.error("Failed to get info of target user");
      console.error("Failed to get info of target user: ", error);
    }
  };

  useEffect(() => {
    getUserById();
  }, [targetUserId]);

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

      <div className="audio-call-info">
        {callStatus === "calling" ? (
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
