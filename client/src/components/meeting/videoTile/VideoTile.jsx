import React, { useEffect, useRef } from "react";
import "../../../pages/meeting/meetingScreen/MeetingScreen.css"

const VideoTile = ({ idx, stream, user }) => {
  const videoRef = useRef(null);

  console.log("video link:", stream);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="participant-video" key={idx}>
      <span className="screen-name">{user.fullName}</span>
      <video ref={videoRef} autoPlay playsInline />
    </div>
  );
};

export default VideoTile;
