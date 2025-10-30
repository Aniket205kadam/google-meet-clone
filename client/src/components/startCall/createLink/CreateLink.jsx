import React, { useState } from "react";
import "./CreateLink.css";
import CreateLinkLoader from "../../../utils/loader/createLink/CreateLinkLoader";

const CreateLink = ({ ref, onClick }) => {
  const [link, setLink] = useState("namaskar.com/yig-rjto-wac");
  const [loading, setLoading] = useState(true);

  return (
    <div className="create-link-continer" ref={ref}>
      <div className="create-link-info">
        <p style={{ height: "100%", width: "100%" }}>
          Share this joining info with people that you want in the meeting
        </p>
      </div>
      <div className="create-link-main">
        {loading ? (
          <div>
            <CreateLinkLoader />
          </div>
        ) : (
          <div className="display-link">
            <div className="link-box">
              <span className="link">{link}</span>
              <button className="link-copy-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#2287d4da"
                >
                  <path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z" />
                </svg>
              </button>
            </div>
            <div className="link-options">
              <button className="link-btn">
                <div className="share-logo">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#2287d4da"
                  >
                    <path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm480-280q17 0 28.5-11.5T720-760q0-17-11.5-28.5T680-800q-17 0-28.5 11.5T640-760q0 17 11.5 28.5T680-720Zm0 520ZM200-480Zm480-280Z" />
                  </svg>
                </div>
                <span>Share</span>
              </button>
              <button className="link-btn">
                <div className="join-logo">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#2287d4da"
                  >
                    <path d="M440-440q17 0 28.5-11.5T480-480q0-17-11.5-28.5T440-520q-17 0-28.5 11.5T400-480q0 17 11.5 28.5T440-440ZM280-120v-80l240-40v-445q0-15-9-27t-23-14l-208-34v-80l220 36q44 8 72 41t28 77v512l-320 54Zm-160 0v-80h80v-560q0-34 23.5-57t56.5-23h400q34 0 57 23t23 57v560h80v80H120Zm160-80h400v-560H280v560Z" />
                  </svg>
                </div>
                <span>Join</span>
              </button>
            </div>
          </div>
        )}

        <button className="dismiss-btn" onClick={onClick}>Dismiss</button>
      </div>
    </div>
  );
};

export default CreateLink;
