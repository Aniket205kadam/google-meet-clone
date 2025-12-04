import { useState } from "react";
import "./JoinWithCode.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import MeetingService from "../../services/MeetingService";
import { toast } from "react-toastify";

const JoinWithCode = () => {
  const [code, setCode] = useState("");
  const [isShowTip, setIsShowTip] = useState(false);
  const navigate = useNavigate();
  const previousMeetingCode = localStorage.getItem("meetingCode") || "";
  const { accessToken } = useSelector((state) => state.authentication);

  const meetingService = new MeetingService(accessToken);

  const findIsMeetingExist = async () => {
    try {
      const response = await meetingService.isExist(code);
      console.log(response);
      if (!response) {
        toast.warn("No such meeting");
        navigate("/");
      } else {
        localStorage.setItem("meetingCode", code);
        navigate(`/${code}`);
      }
    } catch (error) {
      console.error(error.message);
      toast.error("Something is wrong...");
      navigate("/");
    }
  };

  const joinToMeeting = async () => {
    await findIsMeetingExist();
  };

  return (
    <div className="join-with-code-page">
      <div className="join-with-code-heading">
        <div className="back-btn" onClick={() => navigate("/")}>
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
        <div className="join-with-code-title">Join with a code</div>
        <button
          className={`join-btn ${code.length > 0 ? "join-btn-active" : ""}`}
          onClick={joinToMeeting}
        >
          Join
        </button>
      </div>
      <div className="join-with-code-main">
        <div className="join-with-code-subtitle">
          Enter the code provider by the meeting organiser
        </div>
        <div className="join-code-input-box">
          <input
            type="text"
            className="join-code-input"
            placeholder="Example: abc-mnop-xyz"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div
          className="tip-meeting-code"
          style={isShowTip ? {} : { display: "none" }}
        >
          Tip: You don't have to enter the dashes of a Meeting code
        </div>
        <button
          className="rejoin-btn"
          style={previousMeetingCode.length === 12 ? {} : { display: "none" }}
          onClick={() => {
            setCode(previousMeetingCode);
            setIsShowTip(true);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#ffffff"
          >
            <path d="M160-200q-33 0-56.5-23.5T80-280v-400q0-33 23.5-56.5T160-760h640q33 0 56.5 23.5T880-680v400q0 33-23.5 56.5T800-200H160Zm0-80h640v-400H160v400Zm160-40h320v-80H320v80ZM200-440h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM200-560h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM160-280v-400 400Z" />
          </svg>
          Rejoin <b>'{previousMeetingCode}'</b>
        </button>
      </div>
    </div>
  );
};

export default JoinWithCode;
