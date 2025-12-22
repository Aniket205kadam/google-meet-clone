import AppConfig from "../../config/AppConfig";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

const GoogleOAuth = ({ onSuccess }) => {
  return (
    <div className="get-phone">
      <div className="bar"></div>
      <div className="phone-form">
        <h3>👋 Hey there! Welcome to Namaskar.</h3>
        <p className="get-phone-p">
          Login with Google to start video calling your favorite people,
          anytime, anywhere! 🌍💖
        </p>
        <div className="google-btn">
          <GoogleOAuthProvider clientId={AppConfig.googleClientId}>
            <GoogleLogin
              onSuccess={onSuccess}
              onError={() => {}}
              type="standard"
              theme="filled_blue"
              shape="rectangular"
              size="large"
              text="continue_with"
              logo_alignment="left"
              className="custom-google-button"
            />
          </GoogleOAuthProvider>
        </div>
        <span className="warning">
          By signing in, you agree to our Terms & Privacy
        </span>
      </div>
    </div>
  );
};

export default GoogleOAuth;
