import { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import BtnLoader from "../../utils/loader/BtnLoader";
import UserService from "../../services/UserService";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store/authSlice";

const GetProfileImg = ({ fullName, birthDate, profile, setProfile }) => {
  
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingSkip, setLoadingSkip] = useState(false);
  const onDrop = useCallback((acceptedFiles) => {
    setProfile(acceptedFiles[0]);
  }, []);
  const accessToken = useSelector((state) => state.authentication.accessToken);
  const dispatch = useDispatch();
  const userService = new UserService(accessToken);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
    maxFiles: 1,
  });

  const accountCompleted = async () => {
    try {
      const isSuccess = await userService.completeAccountAfterOAuth({
        fullName,
        birthDate,
        profile,
      });
      if (isSuccess) {
        dispatch(login({ accessToken, isAuthenticated: true }));
        toast.success("Account setup completed successfully!");
      } else {
        toast.error("Account setup failed. Please try again.");
      }
    } catch (error) {
      console.error("Error completing account:", error);
      toast.error("Something went wrong while completing your account.");
    } finally {
      setLoadingSave(false);
      setLoadingSkip(false);
    }
  };

  return (
    <div className="get-profile">
      <div className="bar"></div>
      <div className="profile-form">
        <h3>Add a profile photo</h3>
        <div className="profile-input" {...getRootProps()}>
          <input {...getInputProps()} style={{ display: "none" }} />
          <img
            src={`${
              profile
                ? URL.createObjectURL(profile)
                : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
            }`}
          />
          <div className="add-icon">
            <FontAwesomeIcon icon={faPlus} />
          </div>
        </div>
        <button
          type="button"
          className="save-btn"
          onClick={() => {
            if (!profile) {
              toast.warn(
                "Kindly upload your profile picture before continuing."
              );
              return;
            }
            setLoadingSave(true);
            setTimeout(() => {
              accountCompleted();
            }, 2000);
          }}
        >
          {loadingSave ? (
            <BtnLoader
              backgroundColor={"#4287f5"}
              width={"40px"}
              height={"40px"}
              borderSize={"5px"}
            />
          ) : (
            "Save"
          )}
        </button>
        <button
          type="button"
          className="skip-btn"
          onClick={() => {
            setLoadingSkip(true);
            setTimeout(() => {
              accountCompleted();
            }, 2000);
          }}
        >
          {loadingSkip ? (
            <BtnLoader
              backgroundColor={"#a1a2a4ff"}
              width={"40px"}
              height={"40px"}
              borderSize={"5px"}
            />
          ) : (
            "Skip"
          )}
        </button>
      </div>
    </div>
  );
};

export default GetProfileImg;
