class MediaDeviceService {
  getCameraStream = async (videoRef, streamRef, isVideoOn, isAudioOn) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: isVideoOn,
      audio: isAudioOn,
    });
    if (videoRef.current) {
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    }
  };

  stopCameraStream = (streamRef, videoRef) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
}

export default MediaDeviceService;
