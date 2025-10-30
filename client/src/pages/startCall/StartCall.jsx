import React, { useRef, useState } from "react";
import "./StartCall.css";
import UserLoading from "../../utils/loader/UserLoading";
import CreateLink from "../../components/startCall/createLink/CreateLink";
import useClickOutside from "../../hooks/useClickOutside";
import { useNavigate } from "react-router-dom";

const StartCall = () => {
  //   const [suggestedUsers, setSuggestedUsers] = useState([
  //     {
  //       profileUrl: "https://randomuser.me/api/portraits/men/21.jpg",
  //       fullName: "Lucas Perry",
  //       email: "lucas.perry@example.com",
  //       mobileNumber: "+1 555-454-5656",
  //     },
  //     {
  //       profileUrl: "https://randomuser.me/api/portraits/women/22.jpg",
  //       fullName: "Ella Bennett",
  //       email: "ella.bennett@example.com",
  //       mobileNumber: "+1 555-565-6767",
  //     },
  //     {
  //       profileUrl: "https://randomuser.me/api/portraits/men/23.jpg",
  //       fullName: "Henry Carter",
  //       email: "henry.carter@example.com",
  //       mobileNumber: "+1 555-676-7878",
  //     },
  //     {
  //       profileUrl: "https://randomuser.me/api/portraits/women/24.jpg",
  //       fullName: "Lily Morgan",
  //       email: "lily.morgan@example.com",
  //       mobileNumber: "+1 555-787-8989",
  //     },
  //     {
  //       profileUrl: "https://randomuser.me/api/portraits/men/25.jpg",
  //       fullName: "Sebastian Brooks",
  //       email: "sebastian.brooks@example.com",
  //       mobileNumber: "+1 555-898-9090",
  //     },
  //     {
  //       profileUrl: "https://randomuser.me/api/portraits/women/26.jpg",
  //       fullName: "Chloe Foster",
  //       email: "chloe.foster@example.com",
  //       mobileNumber: "+1 555-909-1010",
  //     },
  //     {
  //       profileUrl: "https://randomuser.me/api/portraits/men/27.jpg",
  //       fullName: "Nathan Hughes",
  //       email: "nathan.hughes@example.com",
  //       mobileNumber: "+1 555-101-1121",
  //     },
  //     {
  //       profileUrl: "https://randomuser.me/api/portraits/women/28.jpg",
  //       fullName: "Grace Simmons",
  //       email: "grace.simmons@example.com",
  //       mobileNumber: "+1 555-212-2232",
  //     },
  //     {
  //       profileUrl: "https://randomuser.me/api/portraits/men/29.jpg",
  //       fullName: "Oliver James",
  //       email: "oliver.james@example.com",
  //       mobileNumber: "+1 555-323-3343",
  //     },
  //   ]);

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isCreateLinkClick, setIsCreateLinkClick] = useState(false);
  const createLinkRef = useRef(null);
  const navigate = useNavigate();

  useClickOutside(createLinkRef, () => setIsCreateLinkClick(false));

  return (
    <div className="start-call-page">
      {isCreateLinkClick && (
        <CreateLink
          ref={createLinkRef}
          onClick={() => setIsCreateLinkClick(false)}
        />
      )}

      <div className="start-heading">
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
        <span className="main-label">Start a call</span>
      </div>

      <div className="search-option">
        <div className="search-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e3e3e3"
          >
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
          </svg>
        </div>

        <div className="search-box" onClick={() => navigate("/search-users")}>
          <span>Search contacts or dial a number</span>
        </div>
      </div>

      <div className="video-call-options">
        <button
          className="video-call-option"
          onClick={() => setIsCreateLinkClick(true)}
        >
          <div className="video-option-logo">
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
          <span>Create link</span>
        </button>

        <button className="video-call-option">
          <div className="video-option-logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
            </svg>
          </div>
          <span>Schedule</span>
        </button>

        <button className="video-call-option">
          <div className="video-option-logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M500-482q29-32 44.5-73t15.5-85q0-44-15.5-85T500-798q60 8 100 53t40 105q0 60-40 105t-100 53Zm220 322v-120q0-36-16-68.5T662-406q51 18 94.5 46.5T800-280v120h-80Zm80-280v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Zm-480-40q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM0-160v-112q0-34 17.5-62.5T64-378q62-31 126-46.5T320-440q66 0 130 15.5T576-378q29 15 46.5 43.5T640-272v112H0Zm320-400q33 0 56.5-23.5T400-640q0-33-23.5-56.5T320-720q-33 0-56.5 23.5T240-640q0 33 23.5 56.5T320-560ZM80-240h480v-32q0-11-5.5-20T540-306q-54-27-109-40.5T320-360q-56 0-111 13.5T100-306q-9 5-14.5 14T80-272v32Zm240-400Zm0 400Z" />
            </svg>
          </div>
          <span>Group call</span>
        </button>
      </div>

      <div className="suggested-users-container">
        <span className="suggested-info">
          Suggestions{"  "}
          <span className="suggested-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
            </svg>
          </span>
        </span>

        {suggestedUsers.length <= 0 ? (
          <div className="suggested-users">
            <div className="suggested-users-row">
              {Array.from({ length: 3 }, (_, i) => (
                <UserLoading key={i} width={"120px"} height={"120px"} />
              ))}
            </div>
            <div className="suggested-users-row">
              {Array.from({ length: 3 }, (_, i) => (
                <UserLoading key={i} width={"120px"} height={"120px"} />
              ))}
            </div>
            <div className="suggested-users-row">
              {Array.from({ length: 3 }, (_, i) => (
                <UserLoading key={i} width={"120px"} height={"120px"} />
              ))}
            </div>
          </div>
        ) : (
          <div className="suggested-users">
            <div className="suggested-users-row">
              {suggestedUsers.slice(0, 3).map((user, idx) => (
                <div className="suggested-user" key={idx}>
                  <img
                    className="sugg-profile"
                    src={user.profileUrl}
                    alt={user.fullName}
                  />
                  <span className="suggested-user-name">{user.fullName}</span>
                </div>
              ))}
            </div>

            <div className="suggested-users-row">
              {suggestedUsers.slice(3, 6).map((user, idx) => (
                <div className="suggested-user" key={idx}>
                  <img
                    className="sugg-profile"
                    src={user.profileUrl}
                    alt={user.fullName}
                  />
                  <span className="suggested-user-name">{user.fullName}</span>
                </div>
              ))}
            </div>

            <div className="suggested-users-row">
              {suggestedUsers.slice(6, 9).map((user, idx) => (
                <div className="suggested-user" key={idx}>
                  <img
                    className="sugg-profile"
                    src={user.profileUrl}
                    alt={user.fullName}
                  />
                  <span className="suggested-user-name">{user.fullName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartCall;
