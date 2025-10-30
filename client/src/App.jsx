import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import PublicRoute from "./security/route/PublicRoute";
import ProtectedRoute from "./security/route/ProtectedRoute";
import Login from "./pages/authentication/Login";
import Home from "./pages/home/Home";
import NotFoundPage from "./pages/notFoundPage/NotFoundPage";
import SearchPage from "./pages/search/SearchPage";
import PageLoader from "./utils/loader/pageLoader/PageLoader";
import StartCall from "./pages/startCall/StartCall";
import {
  getNewAccessToken,
  startServer,
} from "./services/AuthenticationService";
import { useDispatch, useSelector } from "react-redux";
import { login } from "./store/authSlice";
import { toast } from "react-toastify";
import { useEffect, useState, useRef } from "react";
import "./App.css";
import JoinWithCode from "./pages/joinWithCode/JoinWithCode";
import BeforeCall from "./pages/beforeCall/BeforeCall";
import VideoCalling from "./pages/calling/video/VideoCalling";
import AudioCalling from "./pages/calling/audio/AudioCalling";
import SockJS from "sockjs-client/dist/sockjs.js";
import Stomp from "stompjs";
import UserService from "./services/UserService";
import WebSocketProvider from "./components/webSocket/WebSocketProvider";

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      }
    />
    <Route
      path="/search-users"
      element={
        <ProtectedRoute>
          <SearchPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/create-call"
      element={
        <ProtectedRoute>
          <StartCall />
        </ProtectedRoute>
      }
    />
    <Route
      path="/join-with-code"
      element={
        <ProtectedRoute>
          <JoinWithCode />
        </ProtectedRoute>
      }
    />
    <Route
      path="/before-call/:targetUserId"
      element={
        <ProtectedRoute>
          <BeforeCall />
        </ProtectedRoute>
      }
    />
    <Route
      path="/video-calling/:targetUserId/video/:isVideoOn/audio/:isAudioOn"
      element={
        <ProtectedRoute>
          <VideoCalling />
        </ProtectedRoute>
      }
    />
    <Route
      path="/audio-calling/:targetUserId"
      element={
        <ProtectedRoute>
          <AudioCalling />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

const AppContent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const stompClient = useRef(null);
  const [connectedUser, setConnectedUser] = useState({
    id: "",
    fullName: "",
    email: "",
    profile: "",
  });

  const { accessToken } = useSelector((state) => state.authentication);

  const userService = new UserService(accessToken);

  const loadNewAccessToken = async () => {
    try {
      setLoading(true);
      const response = await getNewAccessToken();
      if (!response) {
        navigate("/login");
        return;
      }
      dispatch(login({ accessToken: response, isAuthenticated: true }));
    } catch (error) {
      console.error("Token refresh failed:", error);
      toast.error("Authentication failed. Please log in again.");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const getUserByToken = async () => {
    try {
      const response = await userService.fetchUserByToken();
      setConnectedUser(response);
    } catch (error) {
      toast.error("Failed to fetch connected user");
      console.error("Failed to fetch connected user: ", error);
    }
  };

  const initConfig = async () => {
    const response = await startServer();
    if (!response || response.status !== 200) {
      navigate("/login");
      return;
    }
    setTimeout(() => loadNewAccessToken(), 5000);
  };

  const connectWebSocket = () => {
    if (!accessToken || !connectedUser?.email) {
      console.warn("Missing token or user — skipping WebSocket connection.");
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
            console.log("Incoming signal:", data);
          }
        );
      },
      (error) => {
        console.error("WebSocket connection failed:", error);
      }
    );
  };

  useEffect(() => {
    initConfig();
  }, []);

  useEffect(() => {
    if (!loading && accessToken) {
      getUserByToken();
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="page-loader-container">
        <div className="top-progress-bar">
          <div className="progress-bar"></div>
        </div>
        <PageLoader />
      </div>
    );
  }

  return <AppRoutes />;
};

const App = () => {
  const { accessToken } = useSelector((state) => state.authentication);
  const [connectedUser, setConnectedUser] = useState({
    id: "",
    fullName: "",
    email: "",
    profile: "",
  });
  const userService = new UserService(accessToken);

  const getUserByToken = async () => {
    try {
      const response = await userService.fetchUserByToken();
      setConnectedUser(response);
    } catch (error) {
      toast.error("Failed to fetch connected user");
      console.error("Failed to fetch connected user: ", error);
    }
  };

  useEffect(() => {
    if (accessToken) {
      getUserByToken();
    }
  }, [accessToken]);

  return (
    <BrowserRouter>
      <WebSocketProvider
        accessToken={accessToken}
        connectedUser={connectedUser}
      >
        <AppContent />
      </WebSocketProvider>
    </BrowserRouter>
  );
};

export default App;
