import { useEffect, useRef, useState } from "react";
import "./Login.css";
import GoogleOAuth from "../../components/authentication/GoogleOAuth";
import GetPersonalInfo from "../../components/authentication/GetPersonalInfo";
import GetProfileImg from "../../components/authentication/GetProfileImg";
import LoginBackground from "../../components/animation/LoginBackground";
import { loginWithOAuth } from "../../services/AuthenticationService";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store/authSlice";
import Spinner from "../../utils/loader/spinner/Spinner";

const Login = () => {
  const [isMobile, setIsMobile] = useState(true);
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [profile, setProfile] = useState("");
  const dispatch = useDispatch();

  const mainRef = useRef(null);

  useEffect(() => {
    // mainRef.current.scrollTop = mainRef.current.scrollHeight;
  }, []);

  const googleOAuthHandler = async (credentialResponse) => {
    try {
      const response = await loginWithOAuth(credentialResponse.credential);
      const data = response.data;
      if (data.accountCompleted) {
        dispatch(
          login({
            accessToken: data.accessToken,
            isAuthenticated: true,
          })
        );
      } else if (!data.accountCompleted) {
        dispatch(
          login({
            accessToken: data.accessToken,
            isAuthenticated: false,
          })
        );
        setFullName(data.fullName);
        setStep(2);
      }
    } catch (error) {
      toast.error("");
    }
  };

  const steps = {
    1: <GoogleOAuth onSuccess={googleOAuthHandler} />,
    2: (
      <GetPersonalInfo
        fullName={fullName}
        setFullName={setFullName}
        birthDate={birthDate}
        setBirthDate={setBirthDate}
        setStep={setStep}
      />
    ),
    3: (
      <GetProfileImg
        fullName={fullName}
        birthDate={birthDate}
        profile={profile}
        setProfile={setProfile}
      />
    ),
  };

  return (
    <div className="login-page" ref={mainRef}>
      <LoginBackground />

      {/* <AuthLoading /> */}

      <div className="login-container">
        <form className="login-form">
          <div className="info">
            <h1 className="form-h1">Namaskar👋</h1>
            <p className="form-p">
              Connect instantly, wherever life takes you! ✨ Experience
              crystal-clear video calls 💫 that bring you closer to the people
              who matter most. Sign in now and start sharing moments, laughter,
              and memories—without limits! 💖
            </p>
          </div>
          {!isMobile && (
            <img
              src="https://dyte.io/blog/content/images/2023/02/Dyte-Meeting.png"
              className="demo-image"
            />
          )}
          {/*  */}
          {steps[step]}
        </form>
      </div>
    </div>
  );
};

const AuthLoading = () => {
  return (
    <div className="oauth-loading">
      <div className="o-auth-load">
        <Spinner />
      </div>
    </div>
  );
};

export default Login;
