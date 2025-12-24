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
import { login, updateRefreshToken } from "./store/authSlice";
import { toast } from "react-toastify";
import { useEffect, useState, useRef } from "react";
import "./App.css";
import JoinWithCode from "./pages/joinWithCode/JoinWithCode";
import BeforeCall from "./pages/beforeCall/BeforeCall";
import VideoCalling from "./pages/calling/video/VideoCalling";
import AudioCalling from "./pages/calling/audio/AudioCalling";
import UserService from "./services/UserService";
import WebSocketProvider from "./components/webSocket/WebSocketProvider";
import VideoCallScreen from "./pages/videoCallScreen/VideoCallScreen";
import Meeting from "./pages/meeting/main/Meeting";
import { useWindowWidth } from "./hooks/useWindowWidth";
import AudioCallScreen from "./pages/audioCallScreen/AudioCallScreen";

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
      path="/:meetingCode"
      element={
        <ProtectedRoute>
          <Meeting />
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
    <Route
      path="/calls/:callId"
      element={
        <ProtectedRoute>
          <VideoCallScreen />
        </ProtectedRoute>
      }
    />
    <Route
    path="/audio/call/:callId"
    element={
      <ProtectedRoute>
        <AudioCallScreen />
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

  const screenWidth = useWindowWidth();

  const { accessToken, isAuthenticated } = useSelector(
    (state) => state.authentication
  );

  const userService = new UserService(accessToken);

  const timeoutId = useRef(null);

  const loadNewAccessToken = async () => {
    try {
      setLoading(true);
      const response = await getNewAccessToken();
      if (!response) {
        navigate("/login");
        return;
      }
      if (isAuthenticated) {
        console.log("Run this method:", isAuthenticated);
        updateRefreshToken({ accessToken: response });
      } else {
        dispatch(login({ accessToken: response, isAuthenticated: true }));
      }

      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      timeoutId.current = setTimeout(() => {
        loadNewAccessToken();
      }, 360000); //360000
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

  const getUserByToken = async () => {
    try {
      const userService = new UserService(accessToken);
      const response = await userService.fetchUserByToken();
      setConnectedUser(response);
    } catch (error) {
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
