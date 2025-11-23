import React, { useEffect, useRef, useState } from "react";
import "./InCallMessages.css";
import Message from "../message/Message";
import { useSelector } from "react-redux";
import MessageService from "../../services/MessageService";
import { toast } from "react-toastify";

const InCallMessages = ({
  callDetails,
  currentUser,
  remoteUser,
  onClose,
  stompClient,
  isStompConnected,
  localStream,
  remoteStream,
}) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [position, setPosition] = useState({ x: "50%", y: "60%" });
  const [isDragging, setIsDragging] = useState(false);
  const { accessToken } = useSelector((state) => state.authentication);

  const messageMainRef = useRef(null);
  const messageInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const messageService = new MessageService(accessToken);

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

  const fetchAllMessages = async () => {
    try {
      const response = await messageService.getAllMessagesByCallId(
        callDetails.id
      );
      setMessages([...response]);
    } catch (error) {
      toast.error("Failed to fetch previous messages");
    }
  };

  const listeningMessages = () => {
    return stompClient.current.subscribe(
      `/topic/call/${callDetails.id}/messages/user/${currentUser.email}`,
      (messageResponse) => {
        const message = JSON.parse(messageResponse.body);
        setMessages((msgs) => [...msgs, message]);
      }
    );
  };

  const sendMessageToTargetUser = async () => {
    try {
      if (content.trim().length === 0) {
        messageInputRef.current.focus();
        messageInputRef.current.classList.add("input-error");
        return;
      }
      const message = await messageService.sendMessage(callDetails.id, content);
      setMessages((msgs) => [...msgs, message]);
      setContent("");
    } catch (error) {
      toast.error("Failed to send error!");
    }
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

  useEffect(() => {
    fetchAllMessages();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let subscription;
    if (isStompConnected) {
      subscription = listeningMessages();
    }
    return () => subscription?.unsubscribe?.();
  }, [isStompConnected]);

  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.classList.remove("input-error");
    }
  }, [content]);

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
            <video ref={localVideoRef} autoPlay playsInline muted />
            <span>You</span>
          </div>
          <div className="friend">
            <video ref={remoteVideoRef} autoPlay playsInline muted />
            <span>{remoteUser.fullName.split(" ")[0]}</span>
          </div>
        </div>

        <div className="message-info">
          <span>
            Messages can be seen only during the call by people in the call
          </span>
        </div>

        {messages.map((message) => (
          <Message message={message} currentUser={currentUser} />
        ))}
      </div>

      <div className="message-write">
        <input
          type="text"
          className="message-input"
          placeholder="Send message"
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          ref={messageInputRef}
        />
        <button className="message-send-btn" onClick={sendMessageToTargetUser}>
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
