import { createContext, useEffect, useRef } from "react";
import SockJS from "sockjs-client/dist/sockjs.js";
import Stomp from "stompjs";

const WebSocketContext = createContext(null);

const WebSocketProvider = ({ accessToken, connectedUser, children }) => {
  const stompClient = useRef(null);

  const connectWebSocket = () => {
    if (!accessToken || !connectedUser?.email) {
      return;
    }

    const socket = new SockJS("http://localhost:8080/signal");
    stompClient.current = Stomp.over(socket);
    stompClient.current.debug = null;

    stompClient.current.connect(
      { Authorization: `Bearer ${accessToken}` },
      (frame) => {
        console.log("WebSocket connected:", frame);

        stompClient.current.subscribe(
          `/topic/incoming/call/${connectedUser.email}`,
          (message) => {
            const data = JSON.parse(message.body);
            console.log("📩 Incoming signal:", data);
          }
        );
      },
      (error) => {
        console.error("WebSocket connection failed:", error);
      }
    );
  };

  const sendSignal = () => {
    console.log("send signals");
  };

  useEffect(() => {
    if (accessToken && connectedUser?.email) {
      connectWebSocket();
    }

    return () => {
      if (stompClient.current) {
        stompClient.current.disconnect(() =>
          console.log("🔌 WebSocket disconnected")
        );
      }
    };
  }, [accessToken, connectedUser]);

  return (
    <WebSocketContext.Provider value={{ sendSignal }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
