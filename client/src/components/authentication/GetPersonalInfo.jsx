import React, { useState } from "react";
import BtnLoader from "../../utils/loader/BtnLoader";
import { toast } from "react-toastify";

const GetPersonalInfo = ({
  fullName,
  setFullName,
  birthDate,
  setBirthDate,
  setStep,
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="get-personal-info">
      <div className="bar"></div>
      <div className="info-form">
        <h2>Tell us about yourself</h2>
        <div className="input-box">
          <label htmlFor="fullname">Full name (required):</label>
          <input
            type="text"
            placeholder="Aniket Kadam"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="input-box">
          <label htmlFor="date">Date of Birth (optional): </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="continue-btn"
          onClick={() => {
            if (fullName.length <= 0) {
              toast.warn("Enter your full name to continue.");
              return;
            }
            setLoading(true);
            setTimeout(() => {
              setStep(3);
              setLoading(false);
            }, 2000);
          }}
        >
          {loading ? (
            <BtnLoader
              backgroundColor={"#4287f5"}
              width={"40px"}
              height={"40px"}
              borderSize={"5px"}
            />
          ) : (
            "continue"
          )}
        </button>
      </div>
    </div>
  );
};

export default GetPersonalInfo;
