import React, { useEffect, useRef } from "react";
import "../../../pages/meeting/meetingScreen/MeetingScreen.css"

const VideoTile = ({ idx, stream, user, isSoundOn }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="participant-video" key={idx}>
      <span className="screen-name">{user.fullName}</span>
      <video ref={videoRef} autoPlay playsInline muted={!isSoundOn} />
    </div>
  );
};

export default VideoTile;
