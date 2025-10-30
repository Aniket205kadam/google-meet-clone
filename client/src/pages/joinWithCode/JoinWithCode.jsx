import { useState } from "react";
import "./JoinWithCode.css";
import { useNavigate } from "react-router-dom";

const JoinWithCode = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

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
      </div>
    </div>
  );
};

export default JoinWithCode;
