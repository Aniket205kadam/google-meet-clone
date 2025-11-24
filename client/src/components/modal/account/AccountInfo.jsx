import React from "react";
import "./AccountInfo.css";

const AccountInfo = ({ profileImg, fullName, email, onClose, ref }) => {
  return (
    <div className="account-info-container" ref={ref}>
      <div className="account-heading">
        <div className="close-icon" onClick={onClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e3e3e3"
          >
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        </div>
        <span className="app-name">Namaskar</span>
      </div>
      <div className="main-container">
        <div className="update-info">
          <div className="user-info">
            <div className="curr-info">
              <div className="user-profile">
                <img src={profileImg} />
                <div className="add-another-image">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e3e3e3"
                  >
                    <path d="M480-240q79 0 136-53.5T678-426l30 28 42-42-100-100-100 100 42 42 26-26q-6 53-45 88.5T480-300q-13 0-25.5-2.5T430-310l-44 44q22 12 45.5 19t48.5 7ZM310-340l100-100-42-42-26 26q6-53 45-88.5t93-35.5q13 0 25.5 2.5T530-570l44-44q-22-12-45.5-19t-48.5-7q-79 0-136 53.5T282-454l-30-28-42 42 100 100ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z" />
                  </svg>
                </div>
              </div>
              <div className="user-name">
                <span className="name1">{fullName}</span>
                <span className="email">{email}</span>
              </div>
            </div>
            <div className="expand-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
              >
                <path d="m480-360 160-160H320l160 160Zm0 280q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
              </svg>
            </div>
          </div>

          <button className="goto-settings">
            Manage your Namaskar account
          </button>
        </div>

        <div className="add-phone">
          <div className="phone-logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path d="M640-520v-120H520v-80h120v-120h80v120h120v80H720v120h-80Zm158 400q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z" />
            </svg>
          </div>
          <span>Add your phone number</span>
        </div>
      </div>
      <span className="policy">
        <a href="#">Privacy Policy</a> - <a href="#">Terms of Service</a>
      </span>
    </div>
  );
};

export default AccountInfo;
