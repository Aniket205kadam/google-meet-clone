import React, { useEffect, useState } from "react";
import { useTimeAgo } from "../../hooks/useTimeAgo";
import "./Message.css";

const Message = ({ message }) => {
  const createdAt = useTimeAgo(message.createAt);

  return (
    <div className="message" key={message.createAt}>
      <div className="msg-profile">
        <img src={message.sender.profileUrl} />
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
