import React, { useEffect, useState } from "react";
import { useTimeAgo } from "../../hooks/useTimeAgo";
import "./Message.css";

const Message = ({ message, currentUser }) => {
  const createdAt = useTimeAgo(message.createdAt);
  const isOwnMessage = currentUser.email === message.sender.email;

  return (
    <div
      className={`message ${isOwnMessage ? "own-message" : ""}`}
      key={message.id}
    >
      <div className="msg-profile">
        <img src={message.sender.profile} />
      </div>
      <div className="msg-content">
        <div className="msg-heading">
          <span className="msg-sender-name">{message.sender.fullName}</span>
          <span className="msg-created-time">{createdAt}</span>
        </div>
        <div className="content">{message.content}</div>
      </div>
    </div>
  );
};

export default Message;
