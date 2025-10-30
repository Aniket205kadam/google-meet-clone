import React, { useEffect, useRef, useState } from "react";
import "./InCallMessages.css";
import Message from "../message/Message";

const messages = [
  {
    content: "Hey, how are you?",
    sender: {
      fullName: "Alice Johnson",
      email: "alice.johnson@example.com",
      profileUrl: "https://randomuser.me/api/portraits/women/21.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content: "I'm good, thanks! How about you?",
    sender: {
      fullName: "Bob Smith",
      email: "bob.smith@example.com",
      profileUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content:
      "Doing well! Have you finished the project? It’s been really challenging with all the deadlines and requirements.",
    sender: {
      fullName: "Alice Johnson",
      email: "alice.johnson@example.com",
      profileUrl: "https://randomuser.me/api/portraits/women/21.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content:
      "Yes, just sent it to you via email. Let me know if you have any questions.",
    sender: {
      fullName: "Bob Smith",
      email: "bob.smith@example.com",
      profileUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content:
      "Got it, thanks! I’ll review it tonight and provide feedback tomorrow morning.",
    sender: {
      fullName: "Alice Johnson",
      email: "alice.johnson@example.com",
      profileUrl: "https://randomuser.me/api/portraits/women/21.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content:
      "Perfect. By the way, did you get a chance to check the new design mockups?",
    sender: {
      fullName: "Bob Smith",
      email: "bob.smith@example.com",
      profileUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content:
      "Yes, I saw them. I really like the color palette and layout, but I think we could improve the spacing between sections.",
    sender: {
      fullName: "Alice Johnson",
      email: "alice.johnson@example.com",
      profileUrl: "https://randomuser.me/api/portraits/women/21.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content:
      "Good point. I’ll adjust the spacing and share an updated version by tonight.",
    sender: {
      fullName: "Bob Smith",
      email: "bob.smith@example.com",
      profileUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content: "Thanks! Appreciate it. 😊",
    sender: {
      fullName: "Alice Johnson",
      email: "alice.johnson@example.com",
      profileUrl: "https://randomuser.me/api/portraits/women/21.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content:
      "No problem! By the way, are you joining the team meeting later today?",
    sender: {
      fullName: "Bob Smith",
      email: "bob.smith@example.com",
      profileUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content:
      "Yes, I’ll be there. I hope we get to discuss the new marketing strategy as well.",
    sender: {
      fullName: "Alice Johnson",
      email: "alice.johnson@example.com",
      profileUrl: "https://randomuser.me/api/portraits/women/21.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
  {
    content: "Absolutely. It’s going to be a productive session.",
    sender: {
      fullName: "Bob Smith",
      email: "bob.smith@example.com",
      profileUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    createAt: new Date().toISOString().split(".")[0],
  },
];

const InCallMessages = ({ currentUser, remoteUser, onClose }) => {
  const [position, setPosition] = useState({ x: "50%", y: "60%" });
  const [isDragging, setIsDragging] = useState(false);
  const messageMainRef = useRef(null);

  const startDrag = (e) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const stopDrag = () => setIsDragging(false);

  const moveDrag = (clientX, clientY) => {
    if (!messageMainRef.current) return;
    const rect = messageMainRef.current.getBoundingClientRect();

    let newX = clientX - 100;
    let newY = clientY - 50;

    newX = Math.max(0, Math.min(newX, rect.width - 200));
    newY = Math.max(0, Math.min(newY, rect.height - 100));

    setPosition({ x: newX, y: newY });
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDragging) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        moveDrag(clientX, clientY);
      }
    };

    const handleUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("touchend", handleUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (messageMainRef.current) {
      messageMainRef.current.scrollTop = messageMainRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="in-call-messages-container">
      <div className="in-call-messages-heading">
        <button className="in-call-msg-close-btn" onClick={onClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e3e3e3"
          >
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        </button>
        <span>In-call messages</span>
      </div>

      <div className="message-main-container" ref={messageMainRef}>
        <div
          className="callers"
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          style={
            isDragging
              ? { position: "absolute", left: position.x, top: position.y }
              : { position: "fixed", left: position.x, top: position.y }
          }
        >
          <div className="you">
            <img src={currentUser.profileUrl} />
            <span>You</span>
          </div>
          <div className="friend">
            <img src={remoteUser.profileUrl} />
            <span>{remoteUser.fullName}</span>
          </div>
        </div>

        <div className="message-info">
          <span>
            Messages can be seen only during the call by people in the call
          </span>
        </div>

        {messages.map((message) => (
          <Message message={message} />
        ))}
      </div>

      <div className="message-write">
        <input
          type="text"
          className="message-input"
          placeholder="Send message"
          autoFocus
        />
        <button className="message-send-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="30px"
            viewBox="0 -960 960 960"
            width="30px"
            fill="#e3e3e3"
          >
            <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InCallMessages;
