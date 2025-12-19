import { createContext, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs.js";
import Stomp from "stompjs";
import IncomingVideoCall from "../../pages/incoming/video/IncomingVideoCall";
import { useSelector } from "react-redux";

export const WebSocketContext = createContext(null);

const WebSocketProvider = ({ connectedUser, children }) => {
  const stompClient = useRef(null);
  const [incomingCall, setIncomingCall] = useState({
    status: false,
    data: {},
  });
  const [callStatus, setCallStatus] = useState("calling");
  const [isStompConnected, setIsStompConnected] = useState(false);
  const { accessToken, isAuthenticated } = useSelector((state) => state.authentication);

  const connectWebSocket = () => {
    if (!accessToken || connectedUser.email.length === 0) {
      return;
    }

    const socket = new SockJS("http://localhost:8080/signal");
    stompClient.current = Stomp.over(socket);
    stompClient.current.debug = null;

    stompClient.current.connect(
      { Authorization: `Bearer ${accessToken}` },
      (frame) => {
        console.log("WebSocket connected:", frame);
        setIsStompConnected(true);

        // incoming calls
        stompClient.current.subscribe(
          `/topic/incoming/call/${connectedUser.email}`,
          (message) => {
            const data = JSON.parse(message.body);
            setIncomingCall({ status: true, data: data });
          }
        );

        // call end (cut the call by caller)
        stompClient.current.subscribe(
          `/topic/call/end/${connectedUser.email}`,
          (message) => {
            const data = JSON.parse(message.body);
            setIncomingCall({ status: false, data: {} });
          }
        );

        // call is ringing
        stompClient.current.subscribe(
          `/topic/call/ringing/${connectedUser.email}`,
          (message) => {
            const data = JSON.parse(message.body);
            setCallStatus(data.isRinging ? "RINGING" : callStatus);
          }
        );
      },
      (error) => {
        console.error("WebSocket connection failed:", error);
      }
    );
  };

  useEffect(() => {
    if (accessToken) {
      connectWebSocket();
    }

    return () => {
      if (stompClient.current) {
        stompClient.current.disconnect(() =>
          console.log("WebSocket disconnected")
        );
      }
    };
  }, [isAuthenticated, connectedUser.email]);

  return (
    <WebSocketContext.Provider
      value={{
        stompClient,
        callStatus,
        setIncomingCall,
        isStompConnected,
      }}
    >
      {incomingCall.status && (
        <IncomingVideoCall callInfo={incomingCall.data} />
      )}
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
