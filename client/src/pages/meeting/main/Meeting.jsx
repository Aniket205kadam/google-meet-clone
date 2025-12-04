import React, { useState } from "react";
import { useParams } from "react-router-dom";
import PreJoinScreen from "../preJoinScreen/PreJoinScreen";
import MeetingScreen from "../meetingScreen/MeetingScreen";

const Meeting = () => {
  const { meetingCode } = useParams();
  const [isUserReadyToJoin, setIsUserReadyToJoin] =
    useState(false);

  return (
    <div className="meeting-main-container">
      {isUserReadyToJoin ? (
        <MeetingScreen meetingCode={meetingCode} />
      ) : (
        <PreJoinScreen
          meetingCode={meetingCode}
          setIsUserReadyToJoin={setIsUserReadyToJoin}
        />
      )}
    </div>
  );
};

export default Meeting;
