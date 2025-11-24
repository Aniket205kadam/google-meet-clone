import { useEffect, useState } from "react";
import CallMissed from "../callStatus/CallMissed";
import Outgoing from "../callStatus/Outgoing";
import Incoming from "../callStatus/Incoming";
import { useTimeAgo } from "../../hooks/useTimeAgo";
import "./CallHistoryItem.css";
import { useNavigate } from "react-router-dom";

const CallHistoryItem = ({
  call,
  currentUser,
  setIsShowCallMore,
  setMorePosition,
}) => {
  const [targetUser, setTargetUser] = useState(null);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const createdAt = useTimeAgo(call.startedAt);

  const findCallStatus = () => {
    if (
      call.status === "RINGING" ||
      call.status === "REJECTED" ||
      call.status === "ENDED"
    ) {
      setStatus("missed-call");
    } else if (call.status === "FINISH") {
      if (call.caller.id === currentUser.id) {
        setStatus("outgoing");
      } else {
        setStatus("incoming");
      }
    }
  };

  const findTargetUser = () => {
    setTargetUser(
      call.caller.id === currentUser.id ? call.receiver : call.caller
    );
  };

  useEffect(() => {
    findTargetUser();
    findCallStatus();
  }, []);

  return (
    <div className="call-history-item" key={call.id}>
      <div className="call-history-info" onClick={() => navigate(`/before-call/${targetUser.id}`)}>
        <div className="call-history-profile">
          <img src={targetUser?.profile} />
        </div>
        <div className="call-history-target-info">
          <div className="call-history-email">
            {targetUser?.email.length > 20
              ? targetUser?.email.substring(0, 20) + "..."
              : targetUser?.email}
          </div>
          <div className="call-meta-data">
            <div className="call-status">
              {status === "missed-call" && (
                <div style={{ color: "#b3261e" }}>
                  <CallMissed /> Missed call
                </div>
              )}
              {status === "outgoing" && (
                <div>
                  <Outgoing /> Outgoing call
                </div>
              )}
              {status === "incoming" && (
                <div>
                  <Incoming /> Incoming call
                </div>
              )}
            </div>
            <span>•</span>
            <div className="call-created-at">{createdAt}</div>
          </div>
        </div>
      </div>
      <div
        className="history-more-option"
        onClick={(e) => {
          console.log("x", e.clientX, "y", e.clientY)
          setMorePosition({ clientX: (e.clientX - 203), clientY: e.clientY });
          setIsShowCallMore(true);
        }}
      >
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
  );
};

export default CallHistoryItem;
